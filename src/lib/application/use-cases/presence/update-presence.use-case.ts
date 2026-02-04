// src/lib/application/use-cases/presence/update-presence.use-case.ts
import { IPresenceService } from "../../services/presence.service.interface";
import { IPusherService } from "../../services/pusher.service.interface";

export class UpdatePresenceUseCase {
    constructor(
        private presenceService: IPresenceService,
        private pusherService: IPusherService
    ) { }

    async execute(userId: string, status: "online" | "offline"): Promise<void> {
        const wasOnline = await this.presenceService.isUserOnline(userId);

        if (status === "online") {
            await this.presenceService.setOnline(userId);
            if (!wasOnline) {
                // Broadcast global online status
                await this.pusherService.trigger("global-presence", "user-online", {
                    userId,
                });
            }
        } else {
            await this.presenceService.setOffline(userId);
            if (wasOnline) {
                // Broadcast global offline status
                await this.pusherService.trigger("global-presence", "user-offline", {
                    userId,
                });
            }
        }
    }

    async getOnlineUsers(): Promise<string[]> {
        return await this.presenceService.getOnlineUserIds();
    }
}
