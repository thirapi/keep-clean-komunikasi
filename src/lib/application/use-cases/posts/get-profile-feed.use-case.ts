import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";

export class GetProfileFeedUseCase {
    constructor(
        private postRepository: IPostRepository
    ) { }

    async execute(userId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        return await this.postRepository.findByUserId(userId, currentUserId, filter, limit, offset);
    }

    async getCount(userId: string, filter?: "threads" | "replies" | "reposts" | "media"): Promise<number> {
        return await this.postRepository.countByUserId(userId, filter);
    }

    async executeRemote(remoteActorId: string, currentUserId?: string, filter?: "threads" | "replies" | "reposts" | "media", limit = 20, offset = 0): Promise<PostWithUserDTO[]> {
        return await this.postRepository.findByRemoteActorId(remoteActorId, currentUserId, filter, limit, offset);
    }

    async getCountRemote(remoteActorId: string, filter?: "threads" | "replies" | "reposts" | "media"): Promise<number> {
        return await this.postRepository.countByRemoteActorId(remoteActorId, filter);
    }
}
