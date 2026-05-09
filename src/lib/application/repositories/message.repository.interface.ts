import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export interface IMessageRepository {
  createMessage(
    userId: string,
    content: string,
    roomId: string,
    replyTo?: string,
    attachments?: { url: string; key: string; fileType: string; size?: number }[],
  ): Promise<MessageWithUserDTO>;
  getMessagesByRoomId(roomId: string, limit?: number, before?: Date, after?: Date): Promise<MessageWithUserDTO[]>;
  getMessageById(messageId: string): Promise<MessageWithUserDTO | null>;
  deleteMessage(messageId: string): Promise<void>;
}
