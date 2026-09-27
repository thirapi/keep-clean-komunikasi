import {
    encodeBase32LowerCaseNoPadding,
    encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { IUserRepository } from "@/lib/application/repositories/user.repository.interface";
import { ISessionRepository } from "@/lib/application/repositories/session.repository.interface";
import { SessionRecord, SessionDTO } from "@/lib/entities/models/session.model";
import { AuthenticationError } from "@/lib/entities/errors/common";
import { IActivityLogRepository } from "@/lib/application/repositories/activity-log.repository.interface";
import { getRedis } from "@/lib/redis";

const SESSION_ACTIVITY_LOG_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export class AuthenticationService {
    private SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;
    private SESSION_REFRESH_TIME = 1000 * 60 * 60 * 24 * 15;

    constructor(
        private sessionRepository: ISessionRepository,
        private userRepository: IUserRepository,
        private activityLogRepository: IActivityLogRepository
    ) { }

    generateSessionToken(): string {
        const bytes = new Uint8Array(20);
        crypto.getRandomValues(bytes);
        const token = encodeBase32LowerCaseNoPadding(bytes);
        return token;
    }

    async createSession(token: string, userId: string): Promise<SessionRecord> {
        const sessionId = encodeHexLowerCase(
            sha256(new TextEncoder().encode(token))
        );
        const session: SessionRecord = {
            id: sessionId,
            userId: userId,
            expiresAt: new Date(Date.now() + this.SESSION_EXPIRATION_TIME),
            createdAt: new Date(),
        };
        try {
            await this.sessionRepository.insertSession(session);
            return session;
        } catch (err) {
            throw new AuthenticationError("Error creating session!");
        }
    }

    async validateSession(token: string, context?: { ip?: string; userAgent?: string; metadata?: Record<string, any> }): Promise<SessionDTO> {
        const sessionId = encodeHexLowerCase(
            sha256(new TextEncoder().encode(token))
        );

        const sessionData = await this.sessionRepository.findBySessionId(
            sessionId
        );

        if (!sessionData) {
            return { session: null, user: null };
        }

        if (Date.now() >= sessionData.expiresAt.getTime()) {
            await this.sessionRepository.deleteSession(sessionId);
            return { session: null, user: null };
        }

        if (
            Date.now() >=
            sessionData.expiresAt.getTime() - this.SESSION_REFRESH_TIME
        ) {
            sessionData.expiresAt = new Date(
                Date.now() + this.SESSION_EXPIRATION_TIME
            );

            await this.sessionRepository.updateSession(sessionData);
        }

        const userData = await this.userRepository.findById(
            sessionData.userId
        );

        if (!userData) {
            throw new AuthenticationError("User not Found!");
        }

        // Log session activity (max once per 24 hours).
        // The previous guard was a `SELECT count(*)` over ActivityLog, which ran
        // on every session validation — i.e. every page render, every server
        // action and every Pusher auth request. A Redis SETNX with a 24h TTL
        // expresses the same throttle with a single cheap round-trip and no
        // table scan; if Redis is unreachable we fall back to logging so audit
        // history is never silently lost.
        let shouldLogSessionActivity = true;
        try {
            const claimed = await getRedis().set(
                `activity:session_active:${userData.id}`,
                "1",
                { ex: SESSION_ACTIVITY_LOG_TTL_SECONDS, nx: true }
            );
            shouldLogSessionActivity = claimed === "OK";
        } catch (e) {
            console.warn("Session activity throttle unavailable, logging event", e);
        }

        if (shouldLogSessionActivity) {
            await this.activityLogRepository.insertLog({
                id: crypto.randomUUID(),
                userId: userData.id,
                category: "activity",
                action: "session_active",
                metadata: context?.metadata,
                ipAddress: context?.ip,
                userAgent: context?.userAgent,
                createdAt: new Date(),
            });
        }

        return { session: sessionData, user: userData };
    }

    async invalidateSession(sessionId: string): Promise<void> {
        await this.sessionRepository.deleteSession(sessionId);
    }

    async logEvent(params: {
        userId: string | null;
        category: "auth" | "security" | "activity";
        action: string;
        metadata?: Record<string, any>;
        ip?: string;
        userAgent?: string;
    }): Promise<void> {
        await this.activityLogRepository.insertLog({
            id: crypto.randomUUID(),
            userId: params.userId,
            category: params.category,
            action: params.action,
            metadata: params.metadata,
            ipAddress: params.ip,
            userAgent: params.userAgent,
            createdAt: new Date(),
        });
    }
}
