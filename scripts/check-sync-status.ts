import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function checkStatus() {
    console.log("--- Checking Sync Status (RAW SQL) ---");

    try {
        // 1. Get all local users
        const usersRes = await db.execute(sql`SELECT id, username FROM "User"`);
        console.log(`Local Users found: ${usersRes.rows.length}`);

        for (const u of usersRes.rows) {
            console.log(`\nUser: @${u.username} (${u.id})`);

            // 2. Find who they follow (Remote)
            const followingRes = await db.execute(sql`
                SELECT ra.id, ra.domain, ra.username 
                FROM "Follower" f
                INNER JOIN "RemoteActor" ra ON f."remoteFollowingId" = ra.id
                WHERE f."followerId" = ${u.id}
            `);

            console.log(`  Following ${followingRes.rows.length} remote actors:`);
            for (const f of followingRes.rows) {
                // 3. Count posts from this remote actor
                const postCountRes = await db.execute(sql`
                    SELECT count(*) FROM "Post" 
                    WHERE "remoteActorId" = ${f.id}
                `);
                
                console.log(`    - @${f.username}@${f.domain} -> ${postCountRes.rows[0].count} posts in DB`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
