/**
 * Integration check for RoomRepository.getSidebarRooms against a real Postgres.
 *
 * The app's db module is hard-wired to the Neon serverless driver, which cannot
 * talk to a local container, so this script builds its own drizzle instance
 * over node-postgres and injects it. Only the repository SQL is under test.
 *
 * DATABASE_URL must point at a disposable Postgres holding the drizzle schema.
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/infrastructure/drizzle/schema";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { GetSidebarDataUseCase } from "@/lib/application/use-cases/rooms/get-sidebar-data.use-case";

const USER = "u_me";

let failures = 0;
function t(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label}`);
    console.log(`        expected: ${e}`);
    console.log(`        actual:   ${a}`);
  }
}

async function main() {
  const url = process.env.VERIFY_DATABASE_URL;
  if (!url) throw new Error("VERIFY_DATABASE_URL is required");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema }) as any;

  const repo = new RoomRepository(db);
  const useCase = new GetSidebarDataUseCase(repo as any);

  const rows = await repo.getSidebarRooms(USER);
  console.log("raw rows:", JSON.stringify(rows, null, 2));
  console.log("");

  const data = await useCase.execute(USER);
  console.log("sidebar DTO:", JSON.stringify(data, null, 2));
  console.log("");

  const general = data.channels.find((c) => c.id === "r_general");
  const dm = data.directMessages.find((c) => c.id === "r_dm");

  t("channels count", data.channels.length, 1);
  t("dms count", data.directMessages.length, 1);
  t("channel name", general?.name, "general");
  t("channel avatar", general?.avatar, "/avatars/avatar6.png");
  t("channel url", general?.url, "/channels/r_general");
  t("channel lastMessage", general?.lastMessage, "my own reply");
  t("channel hasUnread (own last msg)", general?.hasUnread, false);
  // The room is read (its newest message is Alice's own), so no mention badge
  // may survive even though an older unread message from Bob mentions her.
  t("channel hasMention suppressed when room is read", general?.hasMention, false);
  t("dm userId", dm?.userId, "u_carol");
  t("dm name", dm?.name, "carol");
  t("dm avatar", dm?.avatar, "/avatars/avatar3.png");
  t("dm lastMessage (image fallback)", dm?.lastMessage, "\u{1F4F7} Foto");
  t("dm hasUnread", dm?.hasUnread, true);
  t("dm hasMention", dm?.hasMention, false);
  t("deleted message not surfaced", JSON.stringify(data).includes("deleted"), false);

  // The regression this query is meant to fix: an unread mention that is NOT
  // the latest message must still set hasMention. With the old
  // `messages: { limit: 1 }` relation only the newest message was inspected.
  // A DM whose newest message is from Carol, so the room counts as unread.
  await db.execute(
    `INSERT INTO "Message" (id, content, "createdAt", "userId", "roomId", "isDeleted")
     VALUES ('m_mention_old', 'ping <@u_me> and <@everyone>', '2024-05-01T10:00:00Z', 'u_bob', 'r_dm', false)`,
  );
  const after = await useCase.execute(USER);
  const dm2 = after.directMessages.find((c) => c.id === "r_dm");
  t("hasMention sees older unread mention", dm2?.hasMention, true);
  t("older mention does not change lastMessage", dm2?.lastMessage, "\u{1F4F7} Foto");

  // Reading the room (Alice sends last) must clear the mention badge.
  await db.execute(
    `INSERT INTO "Message" (id, content, "createdAt", "userId", "roomId", "isDeleted")
     VALUES ('m_dm_read', 'ok thanks', '2024-06-06T10:00:00Z', 'u_me', 'r_dm', false)`,
  );
  const afterRead = await useCase.execute(USER);
  const dmRead = afterRead.directMessages.find((c) => c.id === "r_dm");
  t("mention badge clears once Alice replies last", dmRead?.hasMention, false);
  t("replying marks the DM read", dmRead?.hasUnread, false);

  // Mention rendering: newest DM message mentions the partner by token.
  await db.execute(
    `INSERT INTO "Message" (id, content, "createdAt", "userId", "roomId", "isDeleted")
     VALUES ('m_mention_new', 'hi <@u_carol>', '2024-06-07T10:00:00Z', 'u_me', 'r_dm', false)`,
  );
  const after2 = await useCase.execute(USER);
  const dm3 = after2.directMessages.find((c) => c.id === "r_dm");
  t("partner mention resolved to username", dm3?.lastMessage, "hi @carol");

  console.log("");
  console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
  await pool.end();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
