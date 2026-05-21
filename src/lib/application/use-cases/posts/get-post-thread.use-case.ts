import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";

export class GetPostThreadUseCase {
    constructor(
        private postRepository: IPostRepository
    ) { }

    async execute(postId: string, currentUserId?: string): Promise<{ post: PostWithUserDTO, replies: PostWithUserDTO[] }> {
        const post = await this.postRepository.findByIdWithDetails(postId, currentUserId);

        if (!post) {
            throw new Error("Post not found");
        }

        const replies = await this.postRepository.findReplies(postId, currentUserId);

        return { post, replies };
    }
}
