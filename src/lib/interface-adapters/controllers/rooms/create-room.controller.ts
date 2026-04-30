import { CreateRoomUseCase } from "@/lib/application/use-cases/rooms/create-room.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";
import { z } from "zod";
import { avatarService } from "@/lib/infrastructure/services/avatar.service";

const roomRepository = new RoomRepository(db);
const createRoomUseCase = new CreateRoomUseCase(roomRepository);

const formSchema = z.object({
  name: z.string().min(2).max(100),
  isDirect: z.boolean(),
  participantIds: z.array(z.string().min(1)),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  ownerId: z.string().optional(),
  avatar: z.string().optional(),
});

export const createRoomController = async ({
  name,
  isDirect,
  participantIds,
  description,
  isPublic = false,
  ownerId,
  avatar,
}: {
  name: string;
  isDirect: boolean;
  participantIds: string[];
  description?: string;
  isPublic?: boolean;
  ownerId?: string;
  avatar?: string;
}) => {
  const parsedData = formSchema.safeParse({ name, isDirect, participantIds, description, isPublic, ownerId, avatar });
  
  if (!parsedData.success) {
    throw new Error("Invalid input parameters");
  }

  const roomAvatar = parsedData.data.avatar || avatarService.generateAvatarUrl(parsedData.data.name);

  return await createRoomUseCase.execute(
    parsedData.data.name,
    parsedData.data.isDirect,
    parsedData.data.participantIds,
    roomAvatar,
    parsedData.data.description,
    parsedData.data.isPublic,
    parsedData.data.ownerId
  );
};
