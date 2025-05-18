import { IPusherService } from "../../services/pusher.service.interface";

export class AuthorizePresenceChannelUseCase {
  constructor(private pusherService: IPusherService) {}
  async execute(input: {
    socketId: string;
    channelName: string;
    userId: string;
    username: string;
  }): Promise<any> {
    try {
      return await this.pusherService.authenticatePresence(
        input.socketId,
        input.channelName,
        {
          id: input.userId,
          username: input.username,
        }
      );
    } catch (err) {
      console.error("Pusher error:", err);
      throw new Error("Failed to authorize presence channel");
    }
  }
}
