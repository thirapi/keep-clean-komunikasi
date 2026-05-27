import { HttpSignatureService } from "./http-signature.service";
import { db } from "@/lib/db";
import { UserRepository } from "../repositories/user.repository";

export class ActivityPubFetchService {
    private static userRepo = new UserRepository(db);

    /**
     * Standardized User-Agent for all outbound Fediverse requests.
     * Some instances (like Misskey) are picky and might block simple strings.
     */
    private static USER_AGENT = "Mozilla/5.0 (compatible; Komunikasi/1.0; +https://komunikasi.qzz.io)";

    /**
     * Performs a signed fetch to a remote ActivityPub endpoint.
     * Uses the provided userId to sign, or falls back to a system/admin user.
     */
    static async fetch(url: string, options: RequestInit = {}, signingUserId?: string) {
        let signingUser = null;

        if (signingUserId) {
            signingUser = await this.userRepo.findById(signingUserId);
        }

        // Fallback: If no signing user is provided or found, use the first user in DB as "Instance Actor"
        // In a real production app, you'd have a dedicated system actor.
        if (!signingUser) {
            const users = await (this.userRepo as any).client.query.users.findMany({ limit: 1 });
            if (users.length > 0) {
                signingUser = users[0];
            }
        }

        const targetUrl = new URL(url);
        const method = options.method || "GET";
        const headers: Record<string, string> = {
            "Accept": "application/activity+json, application/ld+json; profile=\"https://www.w3.org/ns/activitystreams\"",
            "User-Agent": this.USER_AGENT,
            "Host": targetUrl.host,
            "Date": new Date().toUTCString(),
            ...(options.headers as Record<string, string> || {})
        };

        // Add Digest for non-GET requests with body
        if (method !== "GET" && options.body) {
            headers["Digest"] = HttpSignatureService.createDigest(options.body as string);
        }

        // Sign the request if we have a user with a private key
        if (signingUser && signingUser.privateKey) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://komunikasi.qzz.io";
            const keyId = `${baseUrl}/api/users/${signingUser.username}#main-key`;
            const path = targetUrl.pathname + targetUrl.search;

            const signature = HttpSignatureService.sign({
                keyId,
                privateKey: signingUser.privateKey,
                method,
                target: path,
                headers
            });

            headers["Signature"] = signature;
        }

        return fetch(url, {
            ...options,
            headers
        });
    }

    /**
     * Unsigned fetch with standardized headers for things like WebFinger
     */
    static async fetchUnsigned(url: string, options: RequestInit = {}) {
        return fetch(url, {
            ...options,
            headers: {
                "Accept": "application/jrd+json, application/activity+json",
                "User-Agent": this.USER_AGENT,
                ...(options.headers as Record<string, string> || {})
            }
        });
    }
}
