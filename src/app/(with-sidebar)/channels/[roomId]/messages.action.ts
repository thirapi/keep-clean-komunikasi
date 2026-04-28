"use server";

import { ServerResponse } from "@/lib/entities/models/response.model";
import { getMessageController } from "@/lib/interface-adapters/controllers/messages/get-message.controller";
import { sendMessageController } from "@/lib/interface-adapters/controllers/messages/send-message.controller";
import {
  startTypingController,
  stopTypingController,
} from "@/lib/interface-adapters/controllers/messages/typing.controller";
import { updateLastReadAtController } from "@/lib/interface-adapters/controllers/rooms/update-last-read-at.controller";
import { getLastReadAtController } from "@/lib/interface-adapters/controllers/rooms/get-last-read-at.controller";

export const setTypingStatusAction = async (
  userId: string,
  roomId: string,
  typing: boolean
): Promise<ServerResponse<null>> => {
  try {
    if (typing) {
      await startTypingController(userId, roomId);
    } else {
      await stopTypingController(userId, roomId);
    }
    return {
      status: "success",
      data: null,
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

import { MessageWithUserDTO } from "@/lib/entities/models/message.model";

export const createMessage = async (
  userId: string,
  content: string,
  roomId: string,
  imageUrl?: string,
  replyTo?: string
): Promise<ServerResponse<MessageWithUserDTO | null>> => {
  try {
    const data = await sendMessageController(userId, content, roomId, imageUrl, replyTo);

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

export const getMessage = async (roomId: string, limit?: number, before?: Date, after?: Date) => {
  try {
    const message = await getMessageController(roomId, limit, before, after);

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
};

import { revalidatePath } from "next/cache";

export const updateLastReadAt = async (
  userId: string,
  roomId: string,
  date: Date
): Promise<ServerResponse<null>> => {
  try {
    await updateLastReadAtController(userId, roomId, date);

    revalidatePath("/", "layout");

    return {
      status: "success",
      data: null,
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

export const getLastReadAt = async (
  userId: string,
  roomId: string
): Promise<ServerResponse<Date | null>> => {
  try {
    const lastReadAt = await getLastReadAtController(userId, roomId);

    return {
      status: "success",
      data: lastReadAt,
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
