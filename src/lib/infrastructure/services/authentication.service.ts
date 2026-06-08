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

    async validateSession(token: string, context?: { ip?: string; userAgent?: string }): Promise<SessionDTO> {
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

        // Log session activity (max once per 24 hours)
        const hasRecentLog = await this.activityLogRepository.hasLogWithinLast24Hours(
            userData.id,
            "session_active"
        );

        if (!hasRecentLog) {
            await this.activityLogRepository.insertLog({
                id: crypto.randomUUID(),
                userId: userData.id,
                category: "activity",
                action: "session_active",
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
