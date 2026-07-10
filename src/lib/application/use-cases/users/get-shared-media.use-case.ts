import { IMessageRepository } from "../../repositories/message.repository.interface";
import { IRoomRepository } from "../../repositories/room.repository.interface";
import { IUserRepository } from "../../repositories/user.repository.interface";
import { AttachmentWithMessageDTO } from "@/lib/entities/models/attachment.model";

export class GetSharedMediaUseCase {
  constructor(
    private messageRepository: IMessageRepository,
    private roomRepository: IRoomRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(currentUserId: string, profileUsername: string): Promise<AttachmentWithMessageDTO[]> {
    const decodedUsername = decodeURIComponent(profileUsername).replace(/^@/, "");
    const profileUser = await this.userRepository.findByUsernameWithRoles(decodedUsername);
    if (!profileUser) return [];

    if (profileUser.id === currentUserId) {
      return this.messageRepository.getAttachmentsByUserId(currentUserId);
    }

    const dmRoom = await this.roomRepository.findDirectRoomBetweenUsers(currentUserId, profileUser.id);
    if (!dmRoom) return [];

    return this.messageRepository.getAttachmentsByRoomId(dmRoom.id);
  }
}
