import { IPostRepository } from "../../repositories/post.repository.interface";
import { IFollowerRepository } from "../../repositories/follower.repository.interface";
import { IAccountFilterRepository } from "../../repositories/account-filter.repository.interface";
import { filterTimelineIntensity } from "../../utils/timeline-filter";
import { PostWithUserDTO } from "@/lib/entities/models/post.model";

export class GetFollowingFeedUseCase {
    constructor(
        private postRepository: IPostRepository,
        private followerRepository: IFollowerRepository,
        private accountFilterRepository: IAccountFilterRepository
    ) { }

    async execute(userId: string, limit: number = 20, offset: number = 0): Promise<PostWithUserDTO[]> {
        const followingIds = await this.followerRepository.getFollowing(userId);
        const remoteFollowingIds = await this.followerRepository.getRemoteFollowing(userId);

        if (followingIds.length === 0 && remoteFollowingIds.length === 0) {
            return [];
        }

        const filters = await this.accountFilterRepository.findByUserId(userId);
        const mutedUserIds = filters.filter(f => f.type === "mute" && f.targetUserId).map(f => f.targetUserId!);
        const mutedRemoteActorIds = filters.filter(f => f.type === "mute" && f.targetRemoteActorId).map(f => f.targetRemoteActorId!);
        const reducedIntensityIds = new Set(filters.filter(f => f.type === "reduce_intensity").map(f => f.targetUserId || f.targetRemoteActorId).filter((id): id is string => !!id));

        let allProcessedPosts: PostWithUserDTO[] = [];
        let currentDBOffset = offset;
        let attempts = 0;
        const maxAttempts = 3;

        while (allProcessedPosts.length < limit && attempts < maxAttempts) {
            const fetchLimit = Math.max(limit * 2, 50);
            const posts = await this.postRepository.getFollowingFeed(
                followingIds, 
                remoteFollowingIds, 
                fetchLimit, 
                currentDBOffset, 
                userId,
                mutedUserIds,
                mutedRemoteActorIds
            );

            if (posts.length === 0) break;

            let processed = posts;
            if (reducedIntensityIds.size > 0) {
                processed = filterTimelineIntensity(posts, reducedIntensityIds);
            }

            allProcessedPosts = [...allProcessedPosts, ...processed];
            currentDBOffset += posts.length;
            attempts++;

            if (posts.length < fetchLimit) break;
        }

        return allProcessedPosts.slice(0, limit);
    }
}
