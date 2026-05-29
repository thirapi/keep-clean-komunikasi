import { IUserRepository } from "../../repositories/user.repository.interface";
import { WebFingerService } from "@/lib/infrastructure/services/webfinger.service";
import { ActivityPubFetchService } from "@/lib/infrastructure/services/activitypub-fetch.service";
import { db } from "@/lib/db";
import { RemoteActorRepository } from "@/lib/infrastructure/repositories/remote-actor.repository";
import { PostRepository } from "@/lib/infrastructure/repositories/post.repository";
import { createId } from "@paralleldrive/cuid2";

export class SearchUserUseCase {
    private remoteActorRepo = new RemoteActorRepository(db);
    private postRepo = new PostRepository(db);

    constructor(private userRepository: IUserRepository) { }

    async execute(query: string, limit?: number, currentUserId?: string) {
        const localResults = await this.userRepository.searchUsers(query, limit);
        
        const trimmedQuery = query.trim();
        // If query looks like a handle, try to resolve it via WebFinger
        if (trimmedQuery.includes("@") && trimmedQuery.length > 3) {
            try {
                console.log(`[SearchUser] Attempting remote resolution for: ${trimmedQuery}`);
                const remoteActorUrl = await WebFingerService.resolveHandle(trimmedQuery, currentUserId);
                if (remoteActorUrl) {
                    console.log(`[SearchUser] Resolved to ${remoteActorUrl}, fetching actor data (signed)...`);
                    // Fetch actor details using signed fetch
                    const actorData = await ActivityPubFetchService.fetch(remoteActorUrl, {}, currentUserId).then(async res => {
                        if (!res.ok) {
                            console.error(`[SearchUser] Failed to fetch actor data from ${remoteActorUrl}: ${res.status} ${res.statusText}`);
                            return null;
                        }
                        return res.json();
                    });

                    if (actorData) {
                        const parts = trimmedQuery.startsWith("@") ? trimmedQuery.slice(1).split("@") : trimmedQuery.split("@");
                        const [username, domain] = parts;

                        const remoteResult = {
                            id: remoteActorUrl,
                            username: actorData.preferredUsername || actorData.name || username,
                            avatar: actorData.icon?.url || actorData.image?.url || "/avatars/avatar1.png",
                            isRemote: true,
                            handle: trimmedQuery.startsWith("@") ? trimmedQuery : `@${trimmedQuery}`
                        };

                        // Upsert to RemoteActor table so we can link posts to them
                        await this.remoteActorRepo.upsert({
                            id: remoteActorUrl,
                            username: remoteResult.username,
                            domain: domain,
                            name: actorData.name || remoteResult.username,
                            avatar: remoteResult.avatar,
                            inbox: actorData.inbox,
                            sharedInbox: actorData.endpoints?.sharedInbox,
                            publicKey: actorData.publicKey?.publicKeyPem,
                            followerCount: 0,
                            followingCount: 0,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });

                        // Sync outbox in background
                        if (actorData.outbox) {
                            this.fetchRemoteOutbox(actorData.outbox, remoteActorUrl, currentUserId).catch(e => 
                                console.error(`[SearchUser] Outbox sync failed for ${remoteActorUrl}`, e)
                            );
                        }
                        
                        // Add to results if not already present by ID/URI
                        if (!localResults.some(u => u.id === remoteResult.id)) {
                            return [remoteResult, ...localResults];
                        }
                    }
                }
            } catch (err) {
                console.error(`[SearchUser] Error resolving ${trimmedQuery}:`, err);
            }
        }

        return localResults;
    }

    private fetchRemoteOutbox = async (outboxUrl: string, remoteActorId: string, currentUserId?: string) => {
        try {
            const response = await ActivityPubFetchService.fetch(outboxUrl, {}, currentUserId);
            if (!response.ok) return;
            let data = await response.json();

            let items = data.orderedItems || data.items || [];
            if (items.length === 0 && data.first) {
                const pageUrl = typeof data.first === 'string' ? data.first : data.first.id;
                const pageResponse = await ActivityPubFetchService.fetch(pageUrl, {}, currentUserId);
                if (pageResponse.ok) {
                    const pageData = await pageResponse.json();
                    items = pageData.orderedItems || pageData.items || [];
                }
            }

            for (const item of items.slice(0, 10)) {
                let object = item.object;
                if (item.type === "Note") object = item;
                if (!object || object.type !== "Note") continue;

                const existing = await this.postRepo.findByUri(object.id);
                if (existing) continue;

                await this.postRepo.create({
                    id: createId(),
                    content: object.content || "",
                    userId: null as any,
                    remoteActorId: remoteActorId,
                    uri: object.id,
                    url: object.url || object.id,
                    replyToId: null as any,
                    visibility: "public",
                    isDeleted: false,
                    createdAt: new Date(object.published || item.published || Date.now()),
                    updatedAt: new Date(),
                });
            }
        } catch (err) {
            console.error(`[SearchUser] Error in fetchRemoteOutbox:`, err);
        }
    }
}
