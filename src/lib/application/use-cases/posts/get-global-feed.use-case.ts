import { PostWithUserDTO } from "@/lib/entities/models/post.model";
import { IPostRepository } from "@/lib/application/repositories/post.repository.interface";
import { IAccountFilterRepository } from "../../repositories/account-filter.repository.interface";
import { filterTimelineIntensity } from "../../utils/timeline-filter";

export class GetGlobalFeedUseCase {
    constructor(
        private postRepository: IPostRepository,
        private accountFilterRepository: IAccountFilterRepository
    ) { }

    async execute(limit: number = 20, offset: number = 0, currentUserId?: string, filter: "all" | "local" = "all"): Promise<PostWithUserDTO[]> {
        const filters = currentUserId ? await this.accountFilterRepository.findByUserId(currentUserId) : [];
        const mutedUserIds = filters.filter(f => f.type === "mute" && f.targetUserId).map(f => f.targetUserId!);
        const mutedRemoteActorIds = filters.filter(f => f.type === "mute" && f.targetRemoteActorId).map(f => f.targetRemoteActorId!);
        const reducedIntensityIds = new Set(filters.filter(f => f.type === "reduce_intensity").map(f => f.targetUserId || f.targetRemoteActorId).filter((id): id is string => !!id));

        let allProcessedPosts: PostWithUserDTO[] = [];
        let currentDBOffset = offset;
        let attempts = 0;
        const maxAttempts = 3;

        // Looping fetch to ensure we satisfy the 'limit' even after application-level intensity filtering.
        // Mute filtering is now handled at the SQL level for accuracy and performance.
        while (allProcessedPosts.length < limit && attempts < maxAttempts) {
            const fetchLimit = Math.max(limit * 2, 50); 
            const posts = await this.postRepository.getGlobalFeed(
                fetchLimit,
                currentDBOffset,
                currentUserId,
                filter,
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

            if (posts.length < fetchLimit) break; // End of database reached
        }

        return allProcessedPosts.slice(0, limit);
    }
}
