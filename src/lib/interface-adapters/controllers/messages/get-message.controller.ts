import { GetMessageUseCase } from "@/lib/application/use-cases/messages/get-message.use-case";
import { MessageRepository } from "@/lib/infrastructure/repositories/message.repository";
import { z } from "zod";

const messageRepository = new MessageRepository();
const getMessageUseCase = new GetMessageUseCase(messageRepository);

const formSchema = z.object({
    roomId: z.string(),
});
export const getMessageController = async (roomId: string) => {
    const message = {
        roomId,
    };
    const parsedMessage = formSchema.safeParse(message);

    if (!parsedMessage.success) {
        const errorField = {
            ...parsedMessage.error?.flatten().fieldErrors,
        };
        throw new Error(`Invalid input: ${JSON.stringify(errorField)}`);
    }

    return await getMessageUseCase.execute(parsedMessage.data.roomId);
}