/**
 * Sidebar data path: statements and wall clock, measured against a real
 * Postgres. Runs the current single-query projection and, when
 * BASELINE=1, the previous relational getAllRoomsByUserId path, so the two can
 * be compared on identical data.
 *
 * VERIFY_DATABASE_URL must point at a disposable Postgres holding the schema.
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/infrastructure/drizzle/schema";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { GetSidebarDataUseCase } from "@/lib/application/use-cases/rooms/get-sidebar-data.use-case";

const USER = "u_me";
const RUNS = 60;
const CHANNELS = 12;
const DMS = 8;
const MSGS_PER_ROOM = 8;

async function seed(pool: Pool) {
  for (let i = 0; i < CHANNELS; i++) {
    await pool.query(
      `INSERT INTO "Room" (id,name,"isDirect",avatar) VALUES ($1,$2,false,'/a.png') ON CONFLICT DO NOTHING`,
      [`c${i}`, `channel-${i}`],
    );
    for (const uid of [USER, "u_bob"]) {
      await pool.query(
        `INSERT INTO "RoomParticipant" (id,"roomId","userId","lastReadAt") VALUES ($1,$2,$3,'2024-01-01') ON CONFLICT DO NOTHING`,
        [`cp${i}${uid}`, `c${i}`, uid],
      );
    }
    for (let m = 0; m < MSGS_PER_ROOM; m++) {
      await pool.query(
        `INSERT INTO "Message" (id,content,"createdAt","userId","roomId","isDeleted") VALUES ($1,$2,$3,'u_bob',$4,false) ON CONFLICT DO NOTHING`,
        [`cm${i}_${m}`, `message ${m}`, new Date(Date.UTC(2024, 5, 1, m)), `c${i}`],
      );
    }
  }
  for (let i = 0; i < DMS; i++) {
    await pool.query(
      `INSERT INTO "Room" (id,name,"isDirect",avatar) VALUES ($1,$2,true,'/b.png') ON CONFLICT DO NOTHING`,
      [`d${i}`, `dm-${i}`],
    );
    for (const uid of [USER, "u_bob"]) {
      await pool.query(
        `INSERT INTO "RoomParticipant" (id,"roomId","userId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [`dp${i}${uid}`, `d${i}`, uid],
      );
    }
    for (let m = 0; m < MSGS_PER_ROOM; m++) {
      await pool.query(
        `INSERT INTO "Message" (id,content,"createdAt","userId","roomId","isDeleted") VALUES ($1,$2,$3,'u_bob',$4,false) ON CONFLICT DO NOTHING`,
        [`dm${i}_${m}`, `dm message ${m}`, new Date(Date.UTC(2024, 5, 1, m)), `d${i}`],
      );
    }
  }
}

async function time(label: string, fn: () => Promise<unknown>, counter: () => number, reset: () => void) {
  await fn(); // warmup

  // The drizzle logger fires asynchronously relative to the awaited call, so
  // statements are accumulated over the whole loop and divided at the end.
  reset();
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < RUNS; i++) await fn();
  const t1 = process.hrtime.bigint();
  const ms = Number(t1 - t0) / 1e6 / RUNS;
  const statements = counter() / RUNS;
  console.log(
    `${label.padEnd(34)} ${statements.toFixed(2).padStart(7)} stmt  ${ms.toFixed(2).padStart(7)} ms`,
  );
  return { statements, ms };
}

async function main() {
  const url = process.env.VERIFY_DATABASE_URL;
  if (!url) throw new Error("VERIFY_DATABASE_URL is required");

  const pool = new Pool({ connectionString: url });
  await seed(pool);

  let count = 0;
  const db = drizzle(pool, {
    schema,
    logger: { logQuery: () => { count++; } },
  }) as any;
  const repo = new RoomRepository(db);
  const useCase = new GetSidebarDataUseCase(repo as any);

  console.log(
    `dataset: ${CHANNELS} channels + ${DMS} dms, ${(CHANNELS + DMS) * MSGS_PER_ROOM} messages, ${RUNS} runs\n`,
  );
  console.log(`${"path".padEnd(34)} ${"stmts".padStart(5)}        ${"ms".padStart(7)}`);

  const tally = () => count;
  const reset = () => { count = 0; };

  const old = await time("OLD getAllRoomsByUserId (relational)", () => repo.getAllRoomsByUserId(USER), tally, reset);
  const next = await time("NEW getSidebarRooms (single query)", () => repo.getSidebarRooms(USER), tally, reset);
  const full = await time("NEW getSidebarData (use case)", () => useCase.execute(USER), tally, reset);

  console.log("");
  console.log(
    `projection: ${old.statements.toFixed(0)} -> ${next.statements.toFixed(0)} statement(s), ` +
      `${old.ms.toFixed(2)}ms -> ${next.ms.toFixed(2)}ms ` +
      `(${((1 - next.ms / old.ms) * 100).toFixed(0)}% faster)`,
  );
  console.log(`full sidebar render path: ${full.statements.toFixed(0)} statement(s), ${full.ms.toFixed(2)}ms`);

  // How much the server actually has to serialise and ship per call.
  const oldRows = await repo.getAllRoomsByUserId(USER);
  const newRows = await repo.getSidebarRooms(USER);
  const oldBytes = Buffer.byteLength(JSON.stringify(oldRows));
  const newBytes = Buffer.byteLength(JSON.stringify(newRows));
  console.log("");
  console.log(`rows returned:            ${oldRows.length} -> ${newRows.length} (same rooms)`);
  console.log(
    `JSON bytes per call:      ${oldBytes} -> ${newBytes} ` +
      `(-${((1 - newBytes / oldBytes) * 100).toFixed(0)}%)`,
  );

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
