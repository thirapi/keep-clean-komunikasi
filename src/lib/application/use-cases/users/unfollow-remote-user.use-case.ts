import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";

export class UnfollowRemoteUserUseCase {
    constructor(private activityPubService: IActivityPubService) { }

    async execute(localUserId: string, remoteActorUrl: string): Promise<void> {
        // ActivityPubService.unfollowRemote handles both the AP Undo activity and DB removal
        await this.activityPubService.unfollowRemote(localUserId, remoteActorUrl);
    }
}
