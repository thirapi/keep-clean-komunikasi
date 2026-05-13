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
import { uploadFileController } from "@/lib/interface-adapters/controllers/storage/upload-file.controller";
import { MessageWithUserDTO } from "@/lib/entities/models/message.model";
import { revalidatePath } from "next/cache";
import { deleteMessageController } from "@/lib/interface-adapters/controllers/messages/delete-message.controller";
import { editMessageController } from "@/lib/interface-adapters/controllers/messages/edit-message.controller";
import { searchMessagesController } from "@/lib/interface-adapters/controllers/messages/search-messages.controller";

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
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const searchMessagesAction = async (
  query: string,
  roomId?: string,
  limit?: number
): Promise<ServerResponse<MessageWithUserDTO[]>> => {
  try {
    const data = await searchMessagesController(query, roomId, limit);

    return {
      status: "success",
      data,
      error: null,
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return {
      status: "error",
      data: [],
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const deleteMessageAction = async (
  userId: string,
  messageId: string
): Promise<ServerResponse<null>> => {
  try {
    await deleteMessageController(userId, messageId);

    return {
      status: "success",
      data: null,
      error: null,
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const editMessageAction = async (
  userId: string,
  messageId: string,
  content: string
): Promise<ServerResponse<MessageWithUserDTO | null>> => {
  try {
    const data = await editMessageController(userId, messageId, content);

    return {
      status: "success",
      data,
      error: null,
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const createMessage = async (
  userId: string,
  content: string,
  roomId: string,
  replyTo?: string,
  attachments?: { url: string; key: string; fileType: string; size?: number }[],
  optimisticId?: string
): Promise<ServerResponse<MessageWithUserDTO | null>> => {
  try {
    const data = await sendMessageController(userId, content, roomId, replyTo, attachments, optimisticId);

    return {
      status: "success",
      data,
      error: null,
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
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
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const uploadFileAction = async (
  formData: FormData,
  destination?: string
): Promise<ServerResponse<{ fileurl: string; filename: string; size: number; mimetype: string } | null>> => {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return {
        status: "error",
        data: null,
        error: { message: "No file provided", type: "ValidationError" },
      };
    }

    const data = await uploadFileController(file, destination);

    return {
      status: "success",
      data,
      error: null,
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const updateLastReadAt = async (
  userId: string,
  roomId: string,
  messageId: string,
  lastReadAt?: Date
): Promise<ServerResponse<null>> => {
  try {
    if (!userId || userId === "" || userId === "null") {
      return {
        status: "error",
        data: null,
        error: { message: "User ID is required", type: "ValidationError" },
      };
    }

    await updateLastReadAtController(userId, roomId, messageId, lastReadAt);

    revalidatePath("/(with-sidebar)", "layout");

    return {
      status: "success",
      data: null,
      error: null,
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};
export const getLastReadAt = async (
  userId: string,
  roomId: string
): Promise<ServerResponse<{ id: string | null; at: Date | null } | null>> => {
  try {
    const lastReadAt = await getLastReadAtController(userId, roomId);

    return {
      status: "success",
      data: lastReadAt,
      error: null,
    };
  } catch (err: any) {
    console.error("Action Error:", err);
    return {
      status: "error",
      data: null,
      error: {
        message: err.message?.includes("Failed query") ? "Gagal memproses permintaan ke database" : err.message || "Terjadi kesalahan internal",
        type: err.name,
        meta: err.fields,
      },
    };
  }
};
