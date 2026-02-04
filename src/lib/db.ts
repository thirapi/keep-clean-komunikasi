import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./infrastructure/drizzle/schema";

if (process.env.NODE_ENV !== "production") {
    neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
