import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { ActivityPubFetchService } from "@/lib/infrastructure/services/activitypub-fetch.service";
import { createId } from "@paralleldrive/cuid2";

export class GetProfileFeedUseCase {
    constructor(
        private postRepository: IPostRepository,
        private remoteActorRepository: IRemoteActorRepository
    ) { }

    async execute(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        return await this.postRepository.findByUserId(userId, currentUserId, filter, limit, offset);
    }

    async getCount(userId: string, filter?: "threads" | "replies" | "reposts" | "media"): Promise<number> {
        return await this.postRepository.countByUserId(userId, filter);
    }

    async executeRemote(remoteActorId: string | string[], currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        const posts = await this.postRepository.findByRemoteActorId(remoteActorId, currentUserId, filter, limit, offset);
        
        // If we have very few posts locally, try to fetch more from remote outbox
        if (posts.length < limit && offset === 0) {
            const syncId = Array.isArray(remoteActorId) ? remoteActorId[0] : remoteActorId;
            if (syncId) {
                await this.syncRemoteOutbox(syncId, currentUserId);
                // Re-fetch after sync
                return await this.postRepository.findByRemoteActorId(remoteActorId, currentUserId, filter, limit, offset);
            }
        }

        return posts;
    }

    async getCountRemote(remoteActorId: string | string[], filter?: "threads" | "replies" | "reposts" | "media"): Promise<number> {
        return await this.postRepository.countByRemoteActorId(remoteActorId, filter);
    }

    private async syncRemoteOutbox(remoteActorId: string, currentUserId?: string) {
        try {
            const actor = await this.remoteActorRepository.findById(remoteActorId);
            if (!actor) return;

            // Fetch actor data to get outbox URL if we don't have it or it might have changed
            const res = await ActivityPubFetchService.fetch(remoteActorId, {}, currentUserId);
            if (!res.ok) return;
            const actorData = await res.json();
            
            const outboxUrl = actorData.outbox;
            if (!outboxUrl) return;

            const outboxRes = await ActivityPubFetchService.fetch(outboxUrl, {}, currentUserId);
            if (!outboxRes.ok) return;
            const outboxData = await outboxRes.json();

            let items = outboxData.orderedItems || outboxData.items || [];
            
            // If the outbox is a collection with a 'first' page
            if (items.length === 0 && outboxData.first) {
                const pageUrl = typeof outboxData.first === 'string' ? outboxData.first : outboxData.first.id;
                const pageRes = await ActivityPubFetchService.fetch(pageUrl, {}, currentUserId);
                if (pageRes.ok) {
                    const pageData = await pageRes.json();
                    items = pageData.orderedItems || pageData.items || [];
                }
            }

            console.log(`[GetProfileFeed] Syncing ${items.length} items from outbox of ${remoteActorId}`);

            for (const item of items) {
                // ActivityPub outbox usually contains 'Create' or 'Announce' activities
                let object = item.object;
                let published = item.published;
                
                // If it's just the object (some outboxes return Note objects directly)
                if (item.type === "Note") {
                    object = item;
                    published = item.published;
                }

                if (!object || object.type !== "Note") continue;

                const existing = await this.postRepository.findByUri(object.id);
                if (existing) continue;

                // For replies, try to resolve the local ID of the parent
                let parentPostId: string | null = null;
                if (object.inReplyTo) {
                    const parent = await this.postRepository.findByUri(object.inReplyTo);
                    if (parent) {
                        parentPostId = parent.id;
                    }
                }

                await this.postRepository.create({
                    id: createId(),
                    content: object.content || "",
                    userId: null as any,
                    remoteActorId: remoteActorId,
                    uri: object.id,
                    url: object.url || object.id,
                    replyToId: parentPostId as any,
                    visibility: "public",
                    isDeleted: false,
                    createdAt: new Date(object.published || published || Date.now()),
                    updatedAt: new Date(),
                });
            }
        } catch (e) {
            console.error(`[GetProfileFeed] Failed to sync outbox for ${remoteActorId}`, e);
        }
    }
}
