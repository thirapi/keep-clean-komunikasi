import { IPostRepository } from "../../repositories/post.repository.interface";
import { IFollowerRepository } from "../../repositories/follower.repository.interface";
import { IAccountFilterRepository } from "../../repositories/account-filter.repository.interface";
import { filterTimelineIntensity } from "../../utils/timeline-filter";

export class GetFollowingFeedUseCase {
    constructor(
        private postRepository: IPostRepository,
        private followerRepository: IFollowerRepository,
        private accountFilterRepository: IAccountFilterRepository
    ) { }

    async execute(userId: string, limit: number = 20, offset: number = 0) {
        const followingIds = await this.followerRepository.getFollowing(userId);
        const remoteFollowingIds = await this.followerRepository.getRemoteFollowing(userId);

        if (followingIds.length === 0 && remoteFollowingIds.length === 0) {
            return [];
        }

        const filters = await this.accountFilterRepository.findByUserId(userId);
        const mutedIds = new Set(filters.filter(f => f.type === "mute").map(f => f.targetUserId || f.targetRemoteActorId).filter((id): id is string => !!id));
        const reducedIntensityIds = new Set(filters.filter(f => f.type === "reduce_intensity").map(f => f.targetUserId || f.targetRemoteActorId).filter((id): id is string => !!id));

        const overFetchLimit = limit * 2.5;
        const posts = await this.postRepository.getFollowingFeed(followingIds, remoteFollowingIds, overFetchLimit, offset, userId);

        // 1. Filter out muted accounts
        let processedPosts = posts.filter(post => {
            const actorId = post.userId || post.remoteActorId || "unknown";
            return !mutedIds.has(actorId);
        });

        // 2. Apply reduced intensity logic
        if (reducedIntensityIds.size > 0) {
            processedPosts = filterTimelineIntensity(processedPosts, reducedIntensityIds);
        }

        return processedPosts.slice(0, limit);
    }
}
