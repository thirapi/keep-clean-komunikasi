import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IRemoteActorRepository } from "@/lib/application/repositories/remote-actor.repository.interface";
import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";

export class GetPostThreadUseCase {
    constructor(
        private postRepository: IPostRepository,
        private remoteActorRepository: IRemoteActorRepository,
        private activityPubService: IActivityPubService
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

        if (!post && currentUserId && postId.startsWith("http")) {
            // Heal on Demand: If not found, try to resolve from Fediverse
            // This will also trigger reply discovery and parent resolution recursively (up to depth 10)
            const resolved = await this.activityPubService.resolveRemotePost(postId, currentUserId, true);
            if (resolved) {
                post = await this.postRepository.findByIdWithDetails(resolved.id, currentUserId);
            }
        }

        if (!post) {
            throw new Error("Post not found");
        }

        // Context-based Fetching: If we have a conversation context, use it to get everything
        let contextPosts: PostWithUserDTO[] = [];
        if (post.context) {
            contextPosts = await this.postRepository.findByContext(post.context, currentUserId);
        }

        const [replies, parents, thread] = await Promise.all([
            this.postRepository.findReplies(post.id, currentUserId),
            this.postRepository.findParentChain(post.id, currentUserId),
            post.userId ? this.postRepository.findThreadDescendants(post.id, post.userId, currentUserId) : Promise.resolve([])
        ]);

        // Merge context posts if not already present
        const existingIds = new Set([
            ...replies.map(r => r.id),
            ...parents.map(p => p.id),
            ...thread.map(t => t.id),
            post.id
        ]);

        const extraFromContext = contextPosts.filter(cp => !existingIds.has(cp.id));
        
        // Distribute extra context posts
        extraFromContext.forEach(cp => {
            if (cp.replyToId === post.id) {
                replies.push(cp);
            } else {
                // If it's a descendant but not a direct reply, add to thread
                thread.push(cp);
            }
        });

        const threadIds = new Set(thread.map(t => t.id));
        const filteredReplies = replies.filter(r => !threadIds.has(r.id));

        return { post, replies: filteredReplies, parents, thread };
    }
}
