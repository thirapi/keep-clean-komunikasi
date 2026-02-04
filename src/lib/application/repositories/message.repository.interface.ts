import { MessageRecord, MessageWithUserDTO } from "@/lib/entities/models/message.model";

export interface IMessageRepository {
  createMessage(
    userId: string,
    content: string,
    roomId: string,
    imageUrl?: string,
    replyTo?: string,
  ): Promise<MessageWithUserDTO>;
  getMessagesByRoomId(roomId: string, limit?: number, before?: Date): Promise<MessageWithUserDTO[]>;
}
