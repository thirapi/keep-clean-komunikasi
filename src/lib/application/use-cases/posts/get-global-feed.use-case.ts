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
        // If user is logged in, we need to apply filters
        if (currentUserId) {
            const filters = await this.accountFilterRepository.findByUserId(currentUserId);
            const mutedIds = new Set(filters.filter(f => f.type === "mute").map(f => f.targetUserId || f.targetRemoteActorId).filter((id): id is string => !!id));
            const reducedIntensityIds = new Set(filters.filter(f => f.type === "reduce_intensity").map(f => f.targetUserId || f.targetRemoteActorId).filter((id): id is string => !!id));

            // Over-fetching to compensate for filtered posts
            // If many accounts are muted/reduced, we need more data to fill the page
            const overFetchLimit = limit * 2.5; 
            const posts = await this.postRepository.getGlobalFeed(overFetchLimit, offset, currentUserId, filter);

            // 1. Filter out muted accounts
            let processedPosts = posts.filter(post => {
                const actorId = post.userId || post.remoteActorId || "unknown";
                return !mutedIds.has(actorId);
            });

            // 2. Apply reduced intensity logic
            if (reducedIntensityIds.size > 0) {
                processedPosts = filterTimelineIntensity(processedPosts, reducedIntensityIds);
            }

            // Return up to 'limit' posts
            return processedPosts.slice(0, limit);
        }

        return await this.postRepository.getGlobalFeed(limit, offset, currentUserId, filter);
    }
}
