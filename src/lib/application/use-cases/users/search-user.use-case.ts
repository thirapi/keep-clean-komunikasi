import { IUserRepository } from "../../repositories/user.repository.interface";
import { WebFingerService } from "@/lib/infrastructure/services/webfinger.service";

export class SearchUserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(query: string, limit?: number) {
        const localResults = await this.userRepository.searchUsers(query, limit);
        
        // If query looks like a handle, try to resolve it via WebFinger
        if (query.includes("@") && query.length > 3) {
            try {
                const remoteActorUrl = await WebFingerService.resolveHandle(query);
                if (remoteActorUrl) {
                    // Fetch actor details to return a consistent object
                    const actorData = await fetch(remoteActorUrl, {
                        headers: { "Accept": "application/activity+json" }
                    }).then(res => res.json());

                    if (actorData) {
                        const remoteResult = {
                            id: remoteActorUrl,
                            username: actorData.preferredUsername || actorData.name || query,
                            avatar: actorData.icon?.url || "/avatars/avatar1.png",
                            isRemote: true,
                            handle: query.startsWith("@") ? query : `@${query}`
                        };
                        
                        // Add to results if not already present (local/remote duplicate check)
                        if (!localResults.some(u => u.username === remoteResult.username)) {
                            return [remoteResult, ...localResults];
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to resolve remote handle during search:", err);
            }
        }

        return localResults;
    }
}
