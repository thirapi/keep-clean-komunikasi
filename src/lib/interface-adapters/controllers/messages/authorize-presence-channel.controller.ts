import { AuthorizePresenceChannelUseCase } from "@/lib/application/use-cases/messages/authorize-presence-channel.use-case";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";

const pusherService = new PusherService();
const authorizePresenceChannelUseCase = new AuthorizePresenceChannelUseCase(
  pusherService
);

export const authorizePresenceChannelController = async (input: {
  socketId: string;
  channelName: string;
  userId: string;
  username: string;
}) => {
  return await authorizePresenceChannelUseCase.execute(input);
};
