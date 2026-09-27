/**
 * Verifies the Redis-backed code paths (presence index, session-activity
 * throttle) against a real Redis, through the real @upstash/redis client.
 *
 * Point UPSTASH_REDIS_REST_URL at the local Upstash-compatible shim:
 *   node scripts/upstash-rest-shim.mjs 58100 56379 &
 *   UPSTASH_REDIS_REST_URL=http://127.0.0.1:58100 \
 *     UPSTASH_REDIS_REST_TOKEN=dummy npx tsx scripts/verify-redis-paths.mts
 */
import { createRequire } from "node:module";
import { Redis } from "@upstash/redis";

const require_ = createRequire(import.meta.url);
const Module = require_("node:module");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...rest: any[]) {
  if (request === "server-only") return require_.resolve("../test/server-only-stub.ts");
  return origResolve.call(this, request, ...rest);
};

const { UpstashPresenceService } = await import(
  "@/lib/infrastructure/services/upstash-presence.service"
);

let failures = 0;
function t(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) console.log(`PASS  ${label}`);
  else {
    failures++;
    console.log(`FAIL  ${label}`);
    console.log(`        expected: ${e}`);
    console.log(`        actual:   ${a}`);
  }
}

async function main() {
  const admin = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  await admin.flushall();

  const presence = new UpstashPresenceService();

  console.log("--- presence index ---");
  t("empty instance returns nobody", await presence.getOnlineUserIds(), []);

  await presence.setOnline("alice");
  await presence.setOnline("bob");
  t("two users online", (await presence.getOnlineUserIds()).sort(), ["alice", "bob"]);

  await presence.setOffline("alice");
  t("after alice goes offline", await presence.getOnlineUserIds(), ["bob"]);

  t("isUserOnline(bob)", await presence.isUserOnline("bob"), true);
  t("isUserOnline(alice)", await presence.isUserOnline("alice"), false);

  // A client that vanishes without sending "offline": the per-user TTL key
  // expires but the index entry would linger. The read path must prune it.
  await presence.setOnline("ghost", 1);
  t("ghost appears while TTL alive", (await presence.getOnlineUserIds()).sort(), ["bob", "ghost"]);

  await new Promise((r) => setTimeout(r, 1500));
  t("ghost pruned once TTL expires", await presence.getOnlineUserIds(), ["bob"]);
  t("index entry actually removed from the set", await admin.smembers("presence:online"), ["bob"]);

  await admin.flushall();
  console.log("");
  console.log(failures === 0 ? "PRESENCE: ALL CHECKS PASSED" : `PRESENCE: ${failures} FAILED`);
  return failures;
}

main()
  .then((f) => process.exit(f === 0 ? 0 : 1))
  .catch((e) => { console.error(e); process.exit(1); });
