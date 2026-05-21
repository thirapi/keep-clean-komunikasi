import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";

export class GetProfileFeedUseCase {
    constructor(
        private postRepository: IPostRepository
    ) { }

    async execute(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts"): Promise<PostWithUserDTO[]> {
        return await this.postRepository.findByUserId(userId, currentUserId, filter);
    }
}
