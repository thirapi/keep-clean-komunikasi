import { MessageRecord, MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { IMessageRepository } from "../../repositories/message.repository.interface";

export class GetMessageUseCase {
  constructor(private messageRepository: IMessageRepository) {}

  async execute(roomId: string): Promise<MessageWithUserDTO[]> {
    const message = await this.messageRepository.getMessagesByRoomId(roomId);

    if (!message) {
      throw new Error("Message not found");
    }

    return message;
  }
}
