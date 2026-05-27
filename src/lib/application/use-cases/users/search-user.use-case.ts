import { IUserRepository } from "../../repositories/user.repository.interface";
import { WebFingerService } from "@/lib/infrastructure/services/webfinger.service";

export class SearchUserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(query: string, limit?: number) {
        const localResults = await this.userRepository.searchUsers(query, limit);
        
        const trimmedQuery = query.trim();
        // If query looks like a handle, try to resolve it via WebFinger
        if (trimmedQuery.includes("@") && trimmedQuery.length > 3) {
            try {
                console.log(`[SearchUser] Attempting remote resolution for: ${trimmedQuery}`);
                const remoteActorUrl = await WebFingerService.resolveHandle(trimmedQuery);
                if (remoteActorUrl) {
                    console.log(`[SearchUser] Resolved to ${remoteActorUrl}, fetching actor data...`);
                    // Fetch actor details to return a consistent object
                    const actorData = await fetch(remoteActorUrl, {
                        headers: { 
                            "Accept": "application/activity+json",
                            "User-Agent": "Komunikasi/1.0 (+https://komunikasi.qzz.io)"
                        }
                    }).then(res => res.json());

                    if (actorData) {
                        const remoteResult = {
                            id: remoteActorUrl,
                            username: actorData.preferredUsername || actorData.name || trimmedQuery,
                            avatar: actorData.icon?.url || actorData.image?.url || "/avatars/avatar1.png",
                            isRemote: true,
                            handle: trimmedQuery.startsWith("@") ? trimmedQuery : `@${trimmedQuery}`
                        };
                        
                        // Add to results if not already present by ID/URI
                        if (!localResults.some(u => u.id === remoteResult.id)) {
                            return [remoteResult, ...localResults];
                        }
                    }
                }
            } catch (err) {
                console.error(`[SearchUser] Error resolving ${trimmedQuery}:`, err);
            }
        }

        return localResults;
    }
}
