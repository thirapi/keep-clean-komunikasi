import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";

export class GetPostThreadUseCase {
    constructor(
        private postRepository: IPostRepository
    ) { }

    async execute(postId: string, currentUserId?: string): Promise<{ 
        post: PostWithUserDTO, 
        replies: PostWithUserDTO[],
        parents: PostWithUserDTO[],
        thread: PostWithUserDTO[]
    }> {
        const post = await this.postRepository.findByIdWithDetails(postId, currentUserId);

        if (!post) {
            throw new Error("Post not found");
        }

        const [replies, parents, thread] = await Promise.all([
            this.postRepository.findReplies(postId, currentUserId),
            this.postRepository.findParentChain(postId, currentUserId),
            this.postRepository.findThreadDescendants(postId, post.userId, currentUserId)
        ]);

        // Filter out thread descendants from the standard replies to avoid duplication
        const threadIds = new Set(thread.map(t => t.id));
        const filteredReplies = replies.filter(r => !threadIds.has(r.id));

        return { post, replies: filteredReplies, parents, thread };
    }
}
