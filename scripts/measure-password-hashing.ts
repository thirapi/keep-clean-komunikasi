/**
 * Password hashing cost on the sign-in path.
 *
 * bcrypt is deliberately slow, so what matters is not the absolute time but
 * whether the work blocks the Node event loop. This measures:
 *   - bcrypt-ts sync   : blocks the loop for the whole hash
 *   - bcrypt-ts async  : yields between rounds, but is still pure JS on the loop
 *   - @node-rs/bcrypt  : native, runs on the libuv thread pool
 *
 * Run: npx tsx scripts/measure-password-hashing.ts
 */
import { compareSync, genSaltSync, hashSync, hash as hashAsync, compare as compareAsync, genSalt } from "bcrypt-ts";
import { hash as nhash, verify as nverify, hashSync as nhashSync } from "@node-rs/bcrypt";

const ITERATIONS = 20;

async function bench(label: string, fn: () => Promise<void> | void) {
  await fn(); // warm
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) await fn();
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / ITERATIONS;

  // Event-loop lag probe. A 0ms timer is scheduled, then the work runs. If the
  // work occupies the loop, the timer cannot fire until the work returns, so
  // (timer fire time - schedule time) is the blocking window. The work is
  // invoked without awaiting so synchronous implementations block inline.
  const lags: number[] = [];
  for (let i = 0; i < 5; i++) {
    let ranAt = 0n;
    const scheduledAt = process.hrtime.bigint();
    setTimeout(() => { ranAt = process.hrtime.bigint(); }, 0);
    await fn();          // await so async impls are fully awaited too
    if (ranAt === 0n) {
      // still pending -> it was blocked; drain and read the timestamp
      await new Promise<void>((r) => setTimeout(r, 0));
    }
    if (ranAt > 0n) lags.push(Number(ranAt - scheduledAt) / 1e6);
  }
  const medianLag = lags.length
    ? lags.slice().sort((a, b) => a - b)[Math.floor(lags.length / 2)]
    : 0;

  console.log(
    `${label.padEnd(26)} ${ms.toFixed(1).padStart(8)} ms/op  ${medianLag.toFixed(1).padStart(7)} ms event-loop lag`,
  );
  return { ms, maxLag: medianLag };
}

async function main() {
  const password = "password123";
  const saltSync = genSaltSync(10);
  const saltAsync = await genSalt(10);
  const hashS = hashSync(password, saltSync);
  const hashA = await hashAsync(password, saltAsync);

  console.log(`bcrypt cost factor 10, ${ITERATIONS} iterations\n`);
  console.log(`${"implementation".padEnd(26)} ${"time".padStart(14)}  ${"blocking".padStart(22)}`);

  const results: Record<string, { ms: number; maxLag: number }> = {};

  results.sync = await bench("bcrypt-ts hashSync", () => {
    hashSync(password, saltSync);
  });
  results.async = await bench("bcrypt-ts hash (async)", async () => {
    await hashAsync(password, saltAsync);
  });
  results.compareSync = await bench("bcrypt-ts compareSync", () => {
    compareSync(password, hashS);
  });
  results.compareAsync = await bench("bcrypt-ts compare (async)", async () => {
    await compareAsync(password, hashA);
  });
  results.nativeSync = await bench("@node-rs/bcrypt hashSync", () => {
    nhashSync(password, 10);
  });
  results.nativeAsync = await bench("@node-rs/bcrypt hash (async)", async () => {
    await nhash(password, 10);
  });
  const nativeHash = await nhash(password, 10);
  results.nativeVerify = await bench("@node-rs/bcrypt verify (async)", async () => {
    await nverify(password, nativeHash);
  });

  console.log("");
  console.log(`hash:   bcrypt-ts sync ${results.sync.ms.toFixed(1)}ms (loop blocked ${results.sync.maxLag.toFixed(0)}ms)` +
    `   bcrypt-ts async ${results.async.ms.toFixed(1)}ms (loop blocked ${results.async.maxLag.toFixed(0)}ms)`);
  console.log(`        node-rs   sync ${results.nativeSync.ms.toFixed(1)}ms (loop blocked ${results.nativeSync.maxLag.toFixed(0)}ms)` +
    `   node-rs   async ${results.nativeAsync.ms.toFixed(1)}ms (loop blocked ${results.nativeAsync.maxLag.toFixed(0)}ms)`);
  console.log(`verify: bcrypt-ts sync ${results.compareSync.ms.toFixed(1)}ms (blocked ${results.compareSync.maxLag.toFixed(0)}ms)` +
    `   node-rs async ${results.nativeVerify.ms.toFixed(1)}ms (blocked ${results.nativeVerify.maxLag.toFixed(0)}ms)`);
  console.log("");
  console.log("max event-loop lag is the number that matters: it is added to every");
  console.log("other in-flight request on the same server instance while it runs.");
  console.log("");
  console.log("bcrypt-ts 'async' is pure JS, so it does NOT free the event loop —");
  console.log("the native binding is the only thing that moves the work off-thread.");
}

main();
