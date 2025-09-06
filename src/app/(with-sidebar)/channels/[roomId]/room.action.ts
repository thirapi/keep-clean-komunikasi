"use server";
import { ServerResponse } from "@/lib/entities/models/response.model";
import { RoomWithParticipantsDTO } from "@/lib/entities/models/room.model";
import { createRoomController } from "@/lib/interface-adapters/controllers/rooms/create-room.controller";
import { getRoomByIdController } from "@/lib/interface-adapters/controllers/rooms/get-room-by-id.controller";
import { getRoomByUserIdController } from "@/lib/interface-adapters/controllers/rooms/get-room-by-user-id.controller";

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

export const createRoom = async (
  currentUserId: string,
  targetUserId: string
):  Promise<ServerResponse<RoomWithParticipantsDTO | null> & { meta?: { action: "existing" | "created" } }> => {
  try {
    const existingRooms = await getRoomByUserIdController(currentUserId, {
      isDirect: true,
    });

    const existingRoom = existingRooms.find((room) =>
      room.participants.some((p) => p.user.id === targetUserId)
    );

    if (existingRoom) {
      return {
        status: "success",
        data: existingRoom,
        error: null,
        meta: { action: "existing" },
      };
    }

    const newRoom = await createRoomController({
      name: `${currentUserId}-${targetUserId}`,
      isDirect: true,
      participantIds: [currentUserId, targetUserId],
    });

    return {
      status: "success",
      data: newRoom,
      error: null,
      meta: { action: "created" },
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
