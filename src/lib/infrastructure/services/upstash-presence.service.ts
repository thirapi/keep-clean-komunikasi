// src/lib/infrastructure/services/upstash-presence.service.ts
import { Redis } from "@upstash/redis";
import { IPresenceService } from "@/lib/application/services/presence.service.interface";

export class UpstashPresenceService implements IPresenceService {
    private redis: Redis;
    private readonly PRESENCE_KEY_PREFIX = "presence:";
    private readonly DEFAULT_TTL = 60; // 60 seconds

    constructor() {
        this.redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL as string,
            token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
        });
    }

    async setOnline(userId: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
        await this.redis.set(`${this.PRESENCE_KEY_PREFIX}${userId}`, "online", {
            ex: ttl,
        });
    }

    async setOffline(userId: string): Promise<void> {
        await this.redis.del(`${this.PRESENCE_KEY_PREFIX}${userId}`);
    }

    async getOnlineUserIds(): Promise<string[]> {
        const keys = await this.redis.keys(`${this.PRESENCE_KEY_PREFIX}*`);
        return keys.map((key) => key.replace(this.PRESENCE_KEY_PREFIX, ""));
    }

    async isUserOnline(userId: string): Promise<boolean> {
        const status = await this.redis.get(`${this.PRESENCE_KEY_PREFIX}${userId}`);
        return status === "online";
    }
}
