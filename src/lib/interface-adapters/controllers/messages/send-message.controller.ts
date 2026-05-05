import { MessageRecord } from "@/lib/entities/models/message.model";
import { MessageRepository } from "@/lib/infrastructure/repositories/message.repository";
import { SendMessageUseCase } from "@/lib/application/use-cases/messages/send-message.use-case";
import { InputParsedError } from "@/lib/entities/errors/common";
import { z } from "zod";
import { PusherService } from "@/lib/infrastructure/services/pusher.service";

import { db } from "@/lib/db";
import { RoomRepository } from "@/lib/infrastructure/repositories/room.repository";
import { DiscordNotifierService } from "@/lib/infrastructure/services/discord-notifier.service";

const messageRepository = new MessageRepository(db);
const roomRepository = new RoomRepository(db)
const pusherService = new PusherService();
const discordNotifierService = new DiscordNotifierService(process.env.DISCORD_WEBHOOK_URL || "");

const sendMessageUseCase = new SendMessageUseCase(messageRepository, roomRepository, pusherService, discordNotifierService);

const formSchema = z.object({
    content: z.string(),
    roomId: z.string(),
    attachments: z.array(z.object({
        url: z.string(),
        key: z.string(),
        fileType: z.string(),
        size: z.number().optional(),
    })).optional(),
    replyTo: z.string().optional(),
});

export const sendMessageController = async (
    userId: string,
    content: string,
    roomId: string,
    replyTo?: string,
    attachments?: { url: string; key: string; fileType: string; size?: number }[]
) => {

    const parsedMessage = formSchema.safeParse({
        content,
        roomId,
        attachments,
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
        parsedMessage.data.replyTo,
        parsedMessage.data.attachments
    );
};