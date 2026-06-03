import { IAccountFilterRepository } from "../../repositories/account-filter.repository.interface";
import { IRemoteActorRepository } from "../../repositories/remote-actor.repository.interface";

export class ToggleAccountFilterUseCase {
    constructor(
        private accountFilterRepository: IAccountFilterRepository,
        private remoteActorRepository?: IRemoteActorRepository
    ) { }

    async execute(params: {
        userId: string;
        targetId: string;
        isRemote: boolean;
        type: "mute" | "reduce_intensity";
    }) {
        let finalTargetId = params.targetId;

        // Normalization: If remote and targetId looks like a handle (@user@domain), 
        // try to find the actual URI from RemoteActor table
        if (params.isRemote && this.remoteActorRepository && !finalTargetId.startsWith("http")) {
            const parts = finalTargetId.startsWith("@") ? finalTargetId.slice(1).split("@") : finalTargetId.split("@");
            if (parts.length === 2) {
                const [username, domain] = parts;
                const actor = await this.remoteActorRepository.findByUsernameAndDomain(username, domain);
                if (actor) {
                    finalTargetId = actor.id;
                }
            }
        }

        const existing = await this.accountFilterRepository.findSpecific(
            params.userId,
            finalTargetId,
            params.isRemote
        );

        if (existing && existing.type === params.type) {
            // If already exists with same type, remove it (toggle off)
            await this.accountFilterRepository.delete(params.userId, finalTargetId, params.isRemote);
            return { action: "removed", type: params.type };
        } else {
            // Create or update to new type
            await this.accountFilterRepository.upsert({
                userId: params.userId,
                targetUserId: params.isRemote ? null : finalTargetId,
                targetRemoteActorId: params.isRemote ? finalTargetId : null,
                type: params.type,
            });
            return { action: "applied", type: params.type };
        }
    }

    async getFilters(userId: string) {
        return await this.accountFilterRepository.findByUserId(userId);
    }
}
