"use server";
import { ServerResponse } from "@/lib/entities/models/response.model";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { createRoomController } from "@/lib/interface-adapters/controllers/rooms/create-room.controller";
import { getRoomByIdController } from "@/lib/interface-adapters/controllers/rooms/get-room-by-id.controller";
import { getRoomByUserIdController } from "@/lib/interface-adapters/controllers/rooms/get-room-by-user-id.controller";
import { getSidebarDataController } from "@/lib/interface-adapters/controllers/rooms/get-sidebar-data.controller";
import { SidebarRoomDTO } from "@/lib/entities/models/room.model";
import { getPublicRoomsController } from "@/lib/interface-adapters/controllers/rooms/get-public-rooms.controller";

export const getSidebarData = async (
  userId: string
): Promise<ServerResponse<{ channels: SidebarRoomDTO[]; directMessages: SidebarRoomDTO[] }>> => {
  try {
    const data = await getSidebarDataController(userId);

    return {
      status: "success",
      data,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: { channels: [], directMessages: [] },
      error: {
        message: err.message,
        type: err.name,
        meta: err.fields,
      },
    };
  }
};
import { joinRoomController } from "@/lib/interface-adapters/controllers/rooms/join-room.controller";
import { removeParticipantController } from "@/lib/interface-adapters/controllers/rooms/remove-participant.controller";
import { updateRoomController, deleteRoomController } from "@/lib/interface-adapters/controllers/rooms/room-settings.controller";
import { searchInvitableUsersController, inviteToRoomController } from "@/lib/interface-adapters/controllers/rooms/invite-to-room.controller";
import { revalidatePath } from "next/cache";

export const getRoom = async (
  roomId: string
): Promise<ServerResponse<RoomWithParticipantsDTO | null>> => {
  try {
    const room = await getRoomByIdController(roomId);

    return {
      status: "success",
      data: room,
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

export const getRoomsByUserId = async (
  userId: string,
  options?: { isDirect?: boolean }
): Promise<ServerResponse<RoomWithParticipantsDTO[] | null>> => {
  try {
    const rooms = await getRoomByUserIdController(userId, options);

    return {
      status: "success",
      data: rooms,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: [],
      error: {
        message: err.message,
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

import { startDirectMessageController } from "@/lib/interface-adapters/controllers/rooms/start-direct-message.controller";

export const createRoom = async (
  currentUserId: string,
  targetUserId: string
):  Promise<ServerResponse<RoomWithParticipantsDTO | null> & { meta?: { action: "existing" | "created" } }> => {
  try {
    const response = await startDirectMessageController(currentUserId, targetUserId);

    return {
      status: "success",
      data: response.room,
      error: null,
      meta: { action: response.action },
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
export const createChannel = async (
  name: string,
  userId: string,
  description?: string,
  isPublic: boolean = false
): Promise<ServerResponse<RoomWithParticipantsDTO | null>> => {
  try {
    const newRoom = await createRoomController({
      name,
      isDirect: false,
      participantIds: [userId],
      description,
      isPublic,
      ownerId: userId,
    });

    revalidatePath("/");

    return {
      status: "success",
      data: newRoom,
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

export const getPublicRooms = async (
  userId: string
): Promise<ServerResponse<RoomWithParticipantsDTO[]>> => {
  try {
    const rooms = await getPublicRoomsController(userId);

    return {
      status: "success",
      data: rooms,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: [],
      error: {
        message: err.message,
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const joinRoom = async (
  roomId: string,
  userId: string
): Promise<ServerResponse<boolean>> => {
  try {
    await joinRoomController(roomId, userId);

    revalidatePath("/");

    return {
      status: "success",
      data: true,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: false,
      error: {
        message: err.message,
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const removeParticipant = async (
  roomId: string,
  userId: string,
  requesterId: string
): Promise<ServerResponse<boolean>> => {
  try {
    await removeParticipantController(roomId, userId, requesterId);

    revalidatePath("/");

    return {
      status: "success",
      data: true,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: false,
      error: {
        message: err.message,
        type: err.name,
        meta: err.fields,
      },
    };
  }
};

export const updateChannel = async (
  roomId: string,
  requesterId: string,
  data: { name?: string; description?: string; isPublic?: boolean; avatar?: string }
): Promise<ServerResponse<boolean>> => {
  try {
    await updateRoomController(roomId, requesterId, data);
    revalidatePath("/");
    return { status: "success", data: true, error: null };
  } catch (err: any) {
    return {
      status: "error",
      data: false,
      error: { message: err.message, type: err.name, meta: err.fields },
    };
  }
};

export const deleteChannel = async (
  roomId: string,
  requesterId: string
): Promise<ServerResponse<boolean>> => {
  try {
    await deleteRoomController(roomId, requesterId);
    revalidatePath("/");
    return { status: "success", data: true, error: null };
  } catch (err: any) {
    return {
      status: "error",
      data: false,
      error: { message: err.message, type: err.name, meta: err.fields },
    };
  }
};

export const searchInvitableUsers = async (
  roomId: string,
  query: string
): Promise<ServerResponse<{ id: string; username: string; avatar: string}[]>> => {
  try {
    const users = await searchInvitableUsersController(roomId, query);
    return { status: "success", data: users, error: null };
  } catch (err: any) {
    return {
      status: "error",
      data: [],
      error: { message: err.message, type: err.name, meta: err.fields },
    };
  }
};

export const inviteToChannel = async (
  roomId: string,
  requesterId: string,
  targetUserId: string
): Promise<ServerResponse<boolean>> => {
  try {
    await inviteToRoomController(roomId, requesterId, targetUserId);
    revalidatePath("/");
    return { status: "success", data: true, error: null };
  } catch (err: any) {
    return {
      status: "error",
      data: false,
      error: { message: err.message, type: err.name, meta: err.fields },
    };
  }
};
