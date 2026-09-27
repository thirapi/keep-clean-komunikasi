/**
 * Verifies the Redis-backed code paths by injecting a fake Redis client.
 *
 * The underlying command semantics (SET NX EX, SADD/SMEMBERS/SREM) are
 * verified separately against a real redis-cli. What this file pins down is the
 * part that is our code: that the presence index is maintained correctly and
 * that a user whose TTL key expired but whose index entry lingers is pruned
 * rather than reported online.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

/** Minimal in-memory stand-in for the subset of Redis the app uses. */
class FakeRedis {
  strings = new Map<string, string>();
  sets = new Map<string, Set<string>>();
  calls: string[] = [];

  async set(key: string, value: string, opts?: { ex?: number; nx?: boolean }) {
    this.calls.push(
      [
        `set ${key} ${value}`,
        opts?.nx ? "NX" : "",
        opts?.ex ? `EX ${opts.ex}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    if (opts?.nx && this.strings.has(key)) return null;
    this.strings.set(key, value);
    return "OK";
  }
  async get(key: string) {
    this.calls.push(`get ${key}`);
    return this.strings.get(key) ?? null;
  }
  async del(key: string) {
    this.calls.push(`del ${key}`);
    this.strings.delete(key);
    return this.strings.has(key) ? 0 : 1;
  }
  async sadd(key: string, ...members: string[]) {
    this.calls.push(`sadd ${key} ${members.join(" ")}`);
    const s = this.sets.get(key) ?? new Set<string>();
    members.forEach((m) => s.add(m));
    this.sets.set(key, s);
    return members.length;
  }
  async srem(key: string, ...members: string[]) {
    this.calls.push(`srem ${key} ${members.join(" ")}`);
    const s = this.sets.get(key);
    if (!s) return 0;
    members.forEach((m) => s.delete(m));
    return members.length;
  }
  async smembers(key: string) {
    this.calls.push(`smembers ${key}`);
    return Array.from(this.sets.get(key) ?? []);
  }

  /**
   * Chainable stand-in for redis.multi()/pipeline().
   *
   * Mirrors the real client: `chain()` pushes onto a shared command array and
   * returns `this`, so the pipeline is MUTABLE and callers may discard the
   * return value (which the read path in getOnlineUserIds relies on when it
   * queues one GET per candidate in a loop).
   */
  multi() {
    return this._chain();
  }
  pipeline() {
    return this._chain();
  }
  private _chain(): any {
    const self = this;
    const queued: any[][] = [];
    const chain: any = {
      length: () => queued.length,
      exec: async () => {
        const results = [];
        for (const [op, ...args] of queued) {
          results.push(await (self as any)[op](...args));
        }
        return results;
      },
    };
    for (const op of ["set", "del", "sadd", "srem", "get"] as const) {
      chain[op] = (...args: any[]) => {
        queued.push([op, ...args]);
        return chain; // same instance, like the real builder
      };
    }
    return chain;
  }
}

describe("UpstashPresenceService (index maintenance)", () => {
  let fake: FakeRedis;

  beforeEach(() => {
    vi.resetModules();
    fake = new FakeRedis();
    vi.doMock("@/lib/redis", () => ({ getRedis: () => fake }));
  });

  async function load() {
    const mod = await import("@/lib/infrastructure/services/upstash-presence.service");
    return new mod.UpstashPresenceService();
  }

  it("returns nobody when nothing is online", async () => {
    const svc = await load();
    expect(await svc.getOnlineUserIds()).toEqual([]);
  });

  it("reports users it marked online", async () => {
    const svc = await load();
    await svc.setOnline("alice");
    await svc.setOnline("bob");
    expect((await svc.getOnlineUserIds()).sort()).toEqual(["alice", "bob"]);
  });

  it("drops a user from the index when they go offline", async () => {
    const svc = await load();
    await svc.setOnline("alice");
    await svc.setOnline("bob");
    await svc.setOffline("alice");
    expect(await svc.getOnlineUserIds()).toEqual(["bob"]);
  });

  it("checks the per-user TTL key, not just the index", async () => {
    const svc = await load();
    await svc.setOnline("alice");
    expect(await svc.isUserOnline("alice")).toBe(true);
    expect(await svc.isUserOnline("nobody")).toBe(false);
  });

  // The reason the index alone is not enough: a browser that crashes never
  // sends "offline", so the per-user key expires while the index entry stays.
  it("does not report a user whose TTL key expired", async () => {
    const svc = await load();
    await svc.setOnline("alice");
    await svc.setOnline("ghost");

    // Simulate the TTL expiring for ghost only.
    fake.strings.delete("presence:ghost");

    expect(await svc.getOnlineUserIds()).toEqual(["alice"]);
  });

  it("prunes the stale index entry so it does not linger", async () => {
    const svc = await load();
    await svc.setOnline("alice");
    await svc.setOnline("ghost");
    fake.strings.delete("presence:ghost");

    await svc.getOnlineUserIds();
    // Fire-and-forget prune; give the microtask queue a turn.
    await new Promise((r) => setTimeout(r, 0));

    expect(Array.from(fake.sets.get("presence:online") ?? [])).toEqual(["alice"]);
  });

  it("keeps the 60s default TTL on the per-user key", async () => {
    const svc = await load();
    await svc.setOnline("alice");
    expect(fake.calls.join(" | ")).toContain("set presence:alice online EX 60");
  });
});

describe("session activity throttle", () => {
  it("claims once per user then reports taken", async () => {
    const fake = new FakeRedis();
    const claim = () =>
      fake.set(`activity:session_active:u1`, "1", { ex: 86400, nx: true });

    expect(await claim()).toBe("OK");
    expect(await claim()).toBeNull();
    // a different user is unaffected
    expect(await fake.set("activity:session_active:u2", "1", { ex: 86400, nx: true })).toBe("OK");
  });
});
