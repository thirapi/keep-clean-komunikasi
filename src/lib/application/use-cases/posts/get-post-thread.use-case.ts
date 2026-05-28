import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { ActivityPubFetchService } from "@/lib/infrastructure/services/activitypub-fetch.service";
import { createId } from "@paralleldrive/cuid2";

export class GetPostThreadUseCase {
    constructor(
        private postRepository: IPostRepository,
        private remoteActorRepository: IRemoteActorRepository
    ) { }

    async execute(postId: string, currentUserId?: string): Promise<{ 
        post: PostWithUserDTO, 
        replies: PostWithUserDTO[],
        parents: PostWithUserDTO[],
        thread: PostWithUserDTO[]
    }> {
        let post = await this.postRepository.findByIdWithDetails(postId, currentUserId);

        if (!post) {
            // If not found by ID, it might be a URI
            const existingByUri = await this.postRepository.findByUri(postId);
            if (existingByUri) {
                post = await this.postRepository.findByIdWithDetails(existingByUri.id, currentUserId);
            }
        }

        if (!post) {
            throw new Error("Post not found");
        }

        // If the post is remote, we might want to ensure we have its context
        if (post.uri && post.remoteActorId) {
            await this.ensureRemoteContext(post, currentUserId);
        }

        const [replies, parents, thread] = await Promise.all([
            this.postRepository.findReplies(post.id, currentUserId),
            this.postRepository.findParentChain(post.id, currentUserId),
            post.userId ? this.postRepository.findThreadDescendants(post.id, post.userId, currentUserId) : Promise.resolve([])
        ]);

        // Filter out thread descendants from the standard replies to avoid duplication
        const threadIds = new Set(thread.map(t => t.id));
        const filteredReplies = replies.filter(r => !threadIds.has(r.id));

        return { post, replies: filteredReplies, parents, thread };
    }

    private async ensureRemoteContext(post: PostWithUserDTO, currentUserId?: string) {
        if (!post.uri) return;

        // 1. Fetch parent if missing
        if (post.replyToId === null) {
            // We need the raw AP object to find inReplyTo if we don't have it
            try {
                const res = await ActivityPubFetchService.fetch(post.uri, {}, currentUserId);
                if (res.ok) {
                    const data = await res.json();
                    if (data.inReplyTo) {
                        await this.fetchAndStoreRemotePost(data.inReplyTo, currentUserId);
                    }
                }
            } catch (e) {
                console.error(`[GetPostThread] Failed to fetch parent for ${post.uri}`, e);
            }
        }

        // 2. Fetch replies (Mastodon/Misskey often provide a 'replies' collection)
        try {
            const res = await ActivityPubFetchService.fetch(post.uri, {}, currentUserId);
            if (res.ok) {
                const data = await res.json();
                if (data.replies) {
                    const repliesUrl = typeof data.replies === 'string' ? data.replies : data.replies.first?.id || data.replies.id;
                    if (repliesUrl) {
                        const rRes = await ActivityPubFetchService.fetch(repliesUrl, {}, currentUserId);
                        if (rRes.ok) {
                            const rData = await rRes.json();
                            const items = rData.orderedItems || rData.items || [];
                            for (const item of items) {
                                const replyUri = typeof item === 'string' ? item : item.id;
                                if (replyUri) {
                                    await this.fetchAndStoreRemotePost(replyUri, currentUserId);
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`[GetPostThread] Failed to fetch replies for ${post.uri}`, e);
        }
    }

    private async fetchAndStoreRemotePost(uri: string, currentUserId?: string): Promise<string | null> {
        const existing = await this.postRepository.findByUri(uri);
        if (existing) return existing.id;

        try {
            const res = await ActivityPubFetchService.fetch(uri, {}, currentUserId);
            if (!res.ok) return null;
            const object = await res.json();

            if (object.type !== "Note") return null;

            const actorUrl = typeof object.attributedTo === 'string' ? object.attributedTo : object.attributedTo?.id;
            if (!actorUrl) return null;

            // Ensure we have the remote actor
            await this.ensureRemoteActor(actorUrl, currentUserId);
            
            const newPostId = createId();
            await this.postRepository.create({
                id: newPostId,
                content: object.content || "",
                userId: null as any,
                remoteActorId: actorUrl,
                uri: object.id,
                url: object.url || object.id,
                replyToId: object.inReplyTo ? await this.resolveLocalIdByUri(object.inReplyTo) : null,
                visibility: "public",
                isDeleted: false,
                createdAt: new Date(object.published || Date.now()),
                updatedAt: new Date(),
            });

            return newPostId;
        } catch (e) {
            return null;
        }
    }

    private async ensureRemoteActor(actorUrl: string, currentUserId?: string) {
        const existing = await this.remoteActorRepository.findById(actorUrl);
        if (existing) return existing;

        try {
            const res = await ActivityPubFetchService.fetch(actorUrl, {}, currentUserId);
            if (!res.ok) return null;
            const actorData = await res.json();

            const domain = new URL(actorUrl).hostname;
            const bio = actorData.summary ? actorData.summary.replace(/<[^>]*>?/gm, '') : `User from ${domain}`;

            await this.remoteActorRepository.upsert({
                id: actorUrl,
                username: actorData.preferredUsername || actorData.name || "unknown",
                domain: domain,
                name: actorData.name || actorData.preferredUsername,
                bio: bio,
                avatar: actorData.icon?.url || actorData.image?.url,
                banner: actorData.image?.url || null,
                inbox: actorData.inbox,
                sharedInbox: actorData.endpoints?.sharedInbox,
                publicKey: actorData.publicKey?.publicKeyPem,
                followerCount: 0,
                followingCount: 0,
                published: actorData.published ? new Date(actorData.published) : new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        } catch (e) {
            console.error(`[GetPostThread] Failed to ensure remote actor ${actorUrl}`, e);
        }
    }

    private async resolveLocalIdByUri(uri: string): Promise<string | null> {
        const post = await this.postRepository.findByUri(uri);
        return post?.id || null;
    }
}
