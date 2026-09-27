import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/**
 * Single shared Upstash client. Creating one per service opened a separate
 * connection per service; Upstash bills and rate-limits per request, so the
 * instance is reused across services instead.
 */
export function getRedis(): Redis {
  if (client === null) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    });
  }
  return client;
}
