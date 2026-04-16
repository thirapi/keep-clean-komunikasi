import { CreateRoomUseCase } from "@/lib/application/use-cases/rooms/create-room.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { db } from "@/lib/db";
import { z } from "zod";

const roomRepository = new RoomRepository(db);
const createRoomUseCase = new CreateRoomUseCase(roomRepository);

const formSchema = z.object({
  name: z.string().min(2).max(100),
  isDirect: z.boolean(),
  participantIds: z.array(z.string().min(1)),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  ownerId: z.string().optional(),
});

export const createRoomController = async ({
  name,
  isDirect,
  participantIds,
  description,
  isPublic = false,
  ownerId,
}: {
  name: string;
  isDirect: boolean;
  participantIds: string[];
  description?: string;
  isPublic?: boolean;
  ownerId?: string;
}) => {
  const parsedData = formSchema.safeParse({ name, isDirect, participantIds, description, isPublic, ownerId });
  if (!name || participantIds.length === 0) {
    throw new Error("Invalid input parameters");
  }

  if (!parsedData.success) {
    throw new Error("Invalid input parameters");
  }

  return await createRoomUseCase.execute(
    parsedData.data.name,
    parsedData.data.isDirect,
    parsedData.data.participantIds,
    parsedData.data.description,
    parsedData.data.isPublic,
    parsedData.data.ownerId
  );
};
