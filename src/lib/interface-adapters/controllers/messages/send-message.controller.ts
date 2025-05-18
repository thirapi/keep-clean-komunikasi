import { MessageRecord } from "@/lib/entities/models/message.model";
import { MessageRepository } from "@/lib/infrastructure/repositories/message.repository";
import { SendMessageUseCase } from "@/lib/application/use-cases/messages/send-message.use-case";
import { InputParsedError } from "@/lib/entities/errors/common";
import { z } from "zod";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";

import { prisma } from "@/lib/prisma";

const messageRepository = new MessageRepository(prisma);
const pusherService = new PusherService();

const sendMessageUseCase = new SendMessageUseCase(messageRepository, pusherService);

const formSchema = z.object({
    content: z.string(),
    roomId: z.string(),
    imageUrl: z.string().optional(),
    replyTo: z.string().optional(),
});

export const sendMessageController = async (
    userId: string,
    content: string,
    roomId: string,
    imageUrl?: string,
    replyTo?: string
) => {

    const parsedMessage = formSchema.safeParse({
        content,
        roomId,
        imageUrl,
        replyTo,
    });

    if (!parsedMessage.success) {
        const errorField = {
            ...parsedMessage.error?.flatten().fieldErrors,
        };
        throw new InputParsedError("Invalid input: ", errorField);
    }

    return await sendMessageUseCase.execute(
        userId,
        parsedMessage.data.content,
        parsedMessage.data.roomId,
        parsedMessage.data.imageUrl,
        parsedMessage.data.replyTo
    );
};