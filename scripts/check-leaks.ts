import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function checkLeaks() {
    const res = await db.execute(sql`
        SELECT p.id, p.content, p.uri, ra.domain, p."createdAt", p."replyToId", p."repostOfId"
        FROM "Post" p
        JOIN "RemoteActor" ra ON p."remoteActorId" = ra.id
        WHERE ra.domain NOT IN (
            SELECT DISTINCT ra2.domain 
            FROM "Follower" f
            JOIN "RemoteActor" ra2 ON f."remoteFollowingId" = ra2.id
            WHERE f."followerId" IS NOT NULL
        )
        AND p."replyToId" IS NULL
        AND p."repostOfId" IS NULL
        ORDER BY p."createdAt" DESC
        LIMIT 5
    `);
    console.log(res.rows);
}

checkLeaks();
