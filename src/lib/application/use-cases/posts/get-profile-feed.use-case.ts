import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";

export class GetProfileFeedUseCase {
    constructor(
        private postRepository: IPostRepository
    ) { }

    async execute(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        return await this.postRepository.findByUserId(userId, currentUserId, filter, limit, offset);
    }
}
