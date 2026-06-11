import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function runAudit() {
    console.log("\n🔍 Starting Federation Whitelist Audit (Last 48 Hours)\n");
    console.log("=".repeat(60));

    try {
        // 1. Daftar Domain Whitelist Sah
        console.log("\n1. [Whitelist Status] Active Trusted Domains");
        const trustedDomainsRes = await db.execute(sql`
            SELECT DISTINCT ra.domain 
            FROM "Follower" f
            JOIN "RemoteActor" ra ON f."remoteFollowingId" = ra.id
            WHERE f."followerId" IS NOT NULL
        `);
        const trustedDomains = (trustedDomainsRes.rows as any[]).map(r => r.domain);
        console.log(`✅ Total Trusted Domains: ${trustedDomains.length}`);
        if (trustedDomains.length > 0) {
            console.log(`   Sample: ${trustedDomains.slice(0, 5).join(", ")}${trustedDomains.length > 5 ? "..." : ""}`);
        }

        // 2 & 3. Deteksi Postingan Remote & Klasifikasi
        console.log("\n2 & 3. [Leak Detection] Remote Posts from Non-Whitelisted Domains");
        const leaksRes = await db.execute(sql`
            WITH trusted_domains AS (
                SELECT DISTINCT ra.domain 
                FROM "Follower" f
                JOIN "RemoteActor" ra ON f."remoteFollowingId" = ra.id
                WHERE f."followerId" IS NOT NULL
            ),
            recent_remote_posts AS (
                SELECT 
                    p.id, 
                    p."createdAt", 
                    ra.domain, 
                    p."replyToId", 
                    p."repostOfId"
                FROM "Post" p
                JOIN "RemoteActor" ra ON p."remoteActorId" = ra.id
                WHERE p."createdAt" > NOW() - INTERVAL '48 hours'
            )
            SELECT 
                domain,
                COUNT(*) as total_posts,
                COUNT(*) FILTER (WHERE "replyToId" IS NOT NULL) as replies,
                COUNT(*) FILTER (WHERE "repostOfId" IS NOT NULL) as reposts,
                COUNT(*) FILTER (WHERE "replyToId" IS NULL AND "repostOfId" IS NULL) as standalone_leaks
            FROM recent_remote_posts
            WHERE domain NOT IN (SELECT domain FROM trusted_domains)
            GROUP BY domain
            ORDER BY standalone_leaks DESC, total_posts DESC
        `);

        if (leaksRes.rows.length === 0) {
            console.log("✅ No unexpected remote posts found. Whitelist is holding perfectly!");
        } else {
            console.table(leaksRes.rows);
            console.log("\n💡 ANALISIS:");
            console.log("- 'replies' & 'reposts': Normal (Thread Healing / Interaksi)");
            console.log("- 'standalone_leaks': Jika > 0, domain ini berhasil membobol Inbox tanpa relasi follow.");
        }

        // 4. Pertumbuhan Aktor Luar
        console.log("\n4. [Actor Growth] New Remote Actors per Domain");
        const actorGrowthRes = await db.execute(sql`
            SELECT domain, COUNT(*) as actor_count
            FROM "RemoteActor"
            WHERE "createdAt" > NOW() - INTERVAL '48 hours'
            GROUP BY domain
            ORDER BY actor_count DESC
            LIMIT 10
        `);

        if (actorGrowthRes.rows.length === 0) {
            console.log("✅ No new remote actors created in the last 48h.");
        } else {
            console.table(actorGrowthRes.rows);
            console.log("💡 Domain dengan 'actor_count' tinggi namun tidak ada di Whitelist mungkin sedang mencoba spam Follow/Like.");
        }

        console.log("\n" + "=".repeat(60));
        console.log("✅ Audit Complete.");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Audit failed with error:");
        console.error(err);
        process.exit(1);
    }
}

runAudit();
