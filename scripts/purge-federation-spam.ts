import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("🚀 Starting federation spam purge (with NOT EXISTS fix)...");

    try {
        // 1. Get initial stats
        const initialPostsRes = await db.execute(sql`SELECT count(*) FROM "Post"`);
        const initialActorsRes = await db.execute(sql`SELECT count(*) FROM "RemoteActor"`);
        const initialPosts = initialPostsRes.rows[0].count;
        const initialActors = initialActorsRes.rows[0].count;
        console.log(`📊 Initial state: ${initialPosts} posts, ${initialActors} remote actors.`);

        // 2. Identify spam posts
        // Posts with no local userId and whose remoteActor is not followed by any local user
        console.log("🔍 Identifying spam posts...");
        await db.execute(sql`DROP TABLE IF EXISTS temp_spam_posts`);
        await db.execute(sql`
            CREATE TEMPORARY TABLE temp_spam_posts AS
            SELECT id FROM "Post"
            WHERE "userId" IS NULL
            AND NOT EXISTS (
                SELECT 1 FROM "Follower" 
                WHERE "Follower"."remoteFollowingId" = "Post"."remoteActorId"
                AND "Follower"."followerId" IS NOT NULL
            )
        `);
        const spamCountRes = await db.execute(sql`SELECT count(*) FROM temp_spam_posts`);
        const spamCount = spamCountRes.rows[0].count;
        console.log(`🎯 Identified ${spamCount} spam posts.`);

        if (Number(spamCount) > 0) {
            console.log("🧹 Cleaning up relations for spam posts...");
            
            // Delete from relational tables referencing Post
            await db.execute(sql`DELETE FROM "PostHashtag" WHERE "postId" IN (SELECT id FROM temp_spam_posts)`);
            await db.execute(sql`DELETE FROM "PostLinkPreview" WHERE "postId" IN (SELECT id FROM temp_spam_posts)`);
            await db.execute(sql`DELETE FROM "Attachment" WHERE "postId" IN (SELECT id FROM temp_spam_posts)`);
            await db.execute(sql`DELETE FROM "PostReaction" WHERE "postId" IN (SELECT id FROM temp_spam_posts)`);
            await db.execute(sql`DELETE FROM "Bookmark" WHERE "postId" IN (SELECT id FROM temp_spam_posts)`);
            
            // Notifications (mentions, etc)
            await db.execute(sql`DELETE FROM "Notification" WHERE "targetId" IN (SELECT id FROM temp_spam_posts) AND "targetType" = 'post'`);
            
            // Break self-references in Post table (replies, reposts, quotes)
            await db.execute(sql`UPDATE "Post" SET "replyToId" = NULL WHERE "replyToId" IN (SELECT id FROM temp_spam_posts)`);
            await db.execute(sql`UPDATE "Post" SET "repostOfId" = NULL WHERE "repostOfId" IN (SELECT id FROM temp_spam_posts)`);
            await db.execute(sql`UPDATE "Post" SET "quoteOfId" = NULL WHERE "quoteOfId" IN (SELECT id FROM temp_spam_posts)`);

            console.log("🔥 Deleting spam posts...");
            await db.execute(sql`DELETE FROM "Post" WHERE "id" IN (SELECT id FROM temp_spam_posts)`);
        }

        // 3. Identify orphan remote actors
        // Actors with no posts left and not followed by any local user
        console.log("🔍 Identifying orphan remote actors...");
        await db.execute(sql`DROP TABLE IF EXISTS temp_orphan_actors`);
        await db.execute(sql`
            CREATE TEMPORARY TABLE temp_orphan_actors AS
            SELECT id FROM "RemoteActor"
            WHERE NOT EXISTS (
                SELECT 1 FROM "Post" 
                WHERE "Post"."remoteActorId" = "RemoteActor"."id"
            )
            AND NOT EXISTS (
                SELECT 1 FROM "Follower" 
                WHERE "Follower"."remoteFollowingId" = "RemoteActor"."id"
                AND "Follower"."followerId" IS NOT NULL
            )
        `);
        const orphanCountRes = await db.execute(sql`SELECT count(*) FROM temp_orphan_actors`);
        const orphanCount = orphanCountRes.rows[0].count;
        console.log(`🎯 Identified ${orphanCount} orphan remote actors.`);

        if (Number(orphanCount) > 0) {
            console.log("🧹 Cleaning up relations for orphan actors...");
            
            // Clear follows involving these actors (remote follows/followers)
            await db.execute(sql`DELETE FROM "Follower" WHERE "remoteFollowerId" IN (SELECT id FROM temp_orphan_actors) OR "remoteFollowingId" IN (SELECT id FROM temp_orphan_actors)`);
            
            // Clear notifications involving these actors
            await db.execute(sql`DELETE FROM "Notification" WHERE "remoteActorId" IN (SELECT id FROM temp_orphan_actors)`);
            
            // Clear other relations
            await db.execute(sql`DELETE FROM "PostReaction" WHERE "remoteActorId" IN (SELECT id FROM temp_orphan_actors)`);
            await db.execute(sql`DELETE FROM "Bookmark" WHERE "remoteActorId" IN (SELECT id FROM temp_orphan_actors)`);
            await db.execute(sql`DELETE FROM "PushSubscription" WHERE "remoteActorId" IN (SELECT id FROM temp_orphan_actors)`);
            await db.execute(sql`DELETE FROM "MessageReaction" WHERE "remoteActorId" IN (SELECT id FROM temp_orphan_actors)`);
            await db.execute(sql`DELETE FROM "AccountFilter" WHERE "targetRemoteActorId" IN (SELECT id FROM temp_orphan_actors)`);

            console.log("🔥 Deleting orphan remote actors...");
            await db.execute(sql`DELETE FROM "RemoteActor" WHERE "id" IN (SELECT id FROM temp_orphan_actors)`);
        }

        // 4. Final stats
        const finalPostsRes = await db.execute(sql`SELECT count(*) FROM "Post"`);
        const finalActorsRes = await db.execute(sql`SELECT count(*) FROM "RemoteActor"`);
        const finalPosts = finalPostsRes.rows[0].count;
        const finalActors = finalActorsRes.rows[0].count;
        
        console.log(`✨ Cleanup finished!`);
        console.log(`📊 Final state: ${finalPosts} posts, ${finalActors} remote actors.`);
        console.log(`📉 Deleted: ${Number(initialPosts) - Number(finalPosts)} posts, ${Number(initialActors) - Number(finalActors)} actors.`);

        // 5. Vacuum & Analyze
        console.log("📦 Vacuuming and analyzing tables...");
        await db.execute(sql`VACUUM ANALYZE "Post"`);
        await db.execute(sql`VACUUM ANALYZE "RemoteActor"`);
        await db.execute(sql`VACUUM ANALYZE "Notification"`);
        await db.execute(sql`VACUUM ANALYZE "Follower"`);
        console.log("✅ Vacuum complete.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error during purge:", error);
        process.exit(1);
    }
}

main();
