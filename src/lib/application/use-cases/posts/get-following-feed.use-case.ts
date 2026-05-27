import { IPostRepository } from "../../repositories/post.repository.interface";
import { IFollowerRepository } from "../../repositories/follower.repository.interface";

export class GetFollowingFeedUseCase {
    constructor(
        private postRepository: IPostRepository,
        private followerRepository: IFollowerRepository
    ) { }

    async execute(userId: string, limit: number = 20, offset: number = 0) {
        const followingIds = await this.followerRepository.getFollowing(userId);
        const remoteFollowingIds = await this.followerRepository.getRemoteFollowing(userId);

        if (followingIds.length === 0 && remoteFollowingIds.length === 0) {
            return [];
        }

        return await this.postRepository.getFollowingFeed(followingIds, remoteFollowingIds, limit, offset, userId);
    }
}
