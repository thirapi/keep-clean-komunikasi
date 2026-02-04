"use server";

import { ServerResponse } from "@/lib/entities/models/response.model";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { getMessageController } from "@/lib/interface-adapters/controllers/messages/get-message.controller";
import { sendMessageController } from "@/lib/interface-adapters/controllers/messages/send-message.controller";

export const createMessage = async ({
  userId,
  content,
  roomId,
  imageUrl,
  replyTo
}: {
  userId: string;
  content: string;
  roomId: string;
  imageUrl?: string;
  replyTo?: string;
}): Promise<ServerResponse<MessageWithUserDTO | null>> => {
  try {
    const data = await sendMessageController(
      userId,
      content,
      roomId,
      imageUrl,
      replyTo
    );

    return {
      status: "success",
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: null,
      error: {
        message: err.message,
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const getMessage = async (roomId: string) => {
  try {
    const message = await getMessageController(roomId);

    return {
      status: "success",
      data: message,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: null,
      error: {
        message: err.message,
        type: err.name,
        meta: err.fields,
      },
    };
  }
}
