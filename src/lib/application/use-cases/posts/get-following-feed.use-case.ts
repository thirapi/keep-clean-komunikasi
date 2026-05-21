import { IPostRepository } from "../../repositories/post.repository.interface";
import { IFollowerRepository } from "../../repositories/follower.repository.interface";

export class GetFollowingFeedUseCase {
    constructor(
        private postRepository: IPostRepository,
        private followerRepository: IFollowerRepository
    ) { }

    async execute(userId: string, limit: number = 20, offset: number = 0) {
        const followingIds = await this.followerRepository.getFollowing(userId);

        if (followingIds.length === 0) {
            return [];
        }

        // Logic activitypub: In a real fediverse setup, this might fetch from remote outboxes
        // For now, we fetch from local DB for users we follow
        return await (this.postRepository as any).getFollowingFeed(followingIds, limit, offset, userId);
    }
}
