import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function reset() {
    console.log("🔥 Resetting database...");
    try {
        await sql`DROP SCHEMA IF EXISTS public CASCADE`;
        await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
        await sql`CREATE SCHEMA public`;
        console.log("✅ Database reset successful.");
    } catch (error) {
        console.error("❌ Database reset failed:", error);
        process.exit(1);
    }
}

reset();
