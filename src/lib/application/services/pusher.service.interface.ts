// src/lib/application/services/pusher.service.interface.ts
export interface IPusherService {
  trigger(channel: string, event: string, data: any): Promise<void>;

  authenticatePresence(
    socketId: string,
    channelName: string,
    user: { id: string; username: string }
  ): Promise<any>;
}
