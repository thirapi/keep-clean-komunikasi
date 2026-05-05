"use server";

import { ServerResponse } from "@/lib/entities/models/response.model";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { getMessageController } from "@/lib/interface-adapters/controllers/messages/get-message.controller";
import { sendMessageController } from "@/lib/interface-adapters/controllers/messages/send-message.controller";

export const createMessage = async ({
  userId,
  content,
  roomId,
  replyTo,
  attachments,
}: {
  userId: string;
  content: string;
  roomId: string;
  replyTo?: string;
  attachments?: { url: string; key: string; fileType: string; size?: number }[];
}): Promise<ServerResponse<MessageWithUserDTO | null>> => {
  try {
    const data = await sendMessageController(
      userId,
      content,
      roomId,
      replyTo,
      attachments
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
