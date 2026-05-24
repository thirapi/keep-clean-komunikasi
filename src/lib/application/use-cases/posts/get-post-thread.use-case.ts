import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";

export class GetPostThreadUseCase {
    constructor(
        private postRepository: IPostRepository
    ) { }

    async execute(postId: string, currentUserId?: string): Promise<{ 
        post: PostWithUserDTO, 
        replies: PostWithUserDTO[],
        parents: PostWithUserDTO[] 
    }> {
        const post = await this.postRepository.findByIdWithDetails(postId, currentUserId);

        if (!post) {
            throw new Error("Post not found");
        }

        const [replies, parents] = await Promise.all([
            this.postRepository.findReplies(postId, currentUserId),
            this.postRepository.findParentChain(postId, currentUserId)
        ]);

        return { post, replies, parents };
    }
}
