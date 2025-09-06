import { CreateRoomUseCase } from "@/lib/application/use-cases/rooms/create-room.use-case";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const roomRepository = new RoomRepository(prisma);
const createRoomUseCase = new CreateRoomUseCase(roomRepository);

const formSchema = z.object({
  name: z.string().min(2).max(100),
  isDirect: z.boolean(),
  participantIds: z.array(z.string().min(1)),
});

export const createRoomController = async ({
  name,
  isDirect,
  participantIds,
}: {
  name: string;
  isDirect: boolean;
  participantIds: string[];
}) => {
  const parsedData = formSchema.safeParse({ name, isDirect, participantIds });
  if (!name || participantIds.length === 0) {
    throw new Error("Invalid input parameters");
  }

  if (!parsedData.success) {
    throw new Error("Invalid input parameters");
  }

  return await createRoomUseCase.execute(
    parsedData.data.name,
    parsedData.data.isDirect,
    parsedData.data.participantIds
  );
};
