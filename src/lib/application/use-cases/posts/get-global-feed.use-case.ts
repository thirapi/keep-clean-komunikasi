import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";

export class GetGlobalFeedUseCase {
    constructor(
        private postRepository: IPostRepository
    ) { }

    async execute(limit: number = 20, offset: number = 0, currentUserId?: string): Promise<PostWithUserDTO[]> {
        return await this.postRepository.getGlobalFeed(limit, offset, currentUserId);
    }
}
