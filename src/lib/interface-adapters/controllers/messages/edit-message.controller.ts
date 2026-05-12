import { MessageRepository } from "@/lib/infrastructure/repositories/message.repository";
import { EditMessageUseCase } from "@/lib/application/use-cases/messages/edit-message.use-case";
import { z } from "zod";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";
import { db } from "@/lib/db";
import { InputParsedError } from "@/lib/entities/errors/common";

const messageRepository = new MessageRepository(db);
const pusherService = new PusherService();
const editMessageUseCase = new EditMessageUseCase(messageRepository, pusherService);

const schema = z.object({
    messageId: z.string(),
    content: z.string().min(1, "Konten tidak boleh kosong").max(2000, "Konten terlalu panjang"),
});

export const editMessageController = async (
    userId: string,
    messageId: string,
    content: string
) => {
    const parsed = schema.safeParse({ messageId, content });

    if (!parsed.success) {
        throw new InputParsedError("Input tidak valid", parsed.error.flatten().fieldErrors);
    }

    return await editMessageUseCase.execute(userId, messageId, content);
};
