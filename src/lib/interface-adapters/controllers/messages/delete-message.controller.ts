import { MessageRepository } from "@/lib/infrastructure/repositories/message.repository";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { DeleteMessageUseCase } from "@/lib/application/use-cases/messages/delete-message.use-case";
import { InputParsedError } from "@/lib/entities/errors/common";
import { z } from "zod";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { db } from "@/lib/db";

const messageRepository = new MessageRepository(db);
const roomRepository = new RoomRepository(db);
const pusherService = new PusherService();

const deleteMessageUseCase = new DeleteMessageUseCase(messageRepository, roomRepository, pusherService);

const schema = z.object({
    messageId: z.string(),
});

export const deleteMessageController = async (

    userId: string,
    messageId: string
) => {
    const parsed = schema.safeParse({ messageId });

    if (!parsed.success) {
        throw new InputParsedError("Invalid input", parsed.error.flatten().fieldErrors);
    }

    return await deleteMessageUseCase.execute(userId, parsed.data.messageId);
};
