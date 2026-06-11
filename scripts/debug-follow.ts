import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function debugFollow() {
    const domain = 'live.acarsdrama.com';
    const res = await db.execute(sql`
        SELECT f.id, f."followerId", f."remoteFollowingId", ra.domain 
        FROM "Follower" f 
        JOIN "RemoteActor" ra ON f."remoteFollowingId" = ra.id 
        WHERE lower(ra.domain) = ${domain.toLowerCase()}
    `);
    console.log(`Follow records for ${domain}:`, res.rows);
}

debugFollow();
