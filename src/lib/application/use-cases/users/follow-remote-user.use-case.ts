import { IActivityPubService } from "@/lib/application/services/activitypub.service.interface";
import { WebFingerService } from "@/lib/infrastructure/services/webfinger.service";

export class FollowRemoteUserUseCase {
    constructor(private activityPubService: IActivityPubService) { }

    async execute(localUserId: string, handle: string): Promise<void> {
        const remoteActorUrl = await WebFingerService.resolveHandle(handle, localUserId);
        if (!remoteActorUrl) throw new Error("Could not resolve remote user handle");

        await this.activityPubService.followRemote(localUserId, remoteActorUrl);
    }
}
