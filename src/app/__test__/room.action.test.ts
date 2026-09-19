import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getSidebarData,
  getRoom,
  createRoom,
  createChannel,
  getPublicRooms,
  joinRoom,
  removeParticipant,
  updateChannel,
  deleteChannel,
  inviteToChannel,
} from "../(with-sidebar)/channels/[roomId]/room.action";

import { getSidebarDataController } from "@/lib/interface-adapters/controllers/rooms/get-sidebar-data.controller";
import { getRoomByIdController } from "@/lib/interface-adapters/controllers/rooms/get-room-by-id.controller";
import { startDirectMessageController } from "@/lib/interface-adapters/controllers/rooms/start-direct-message.controller";
import { createRoomController } from "@/lib/interface-adapters/controllers/rooms/create-room.controller";
import { getPublicRoomsController } from "@/lib/interface-adapters/controllers/rooms/get-public-rooms.controller";
import { joinRoomController } from "@/lib/interface-adapters/controllers/rooms/join-room.controller";
import { removeParticipantController } from "@/lib/interface-adapters/controllers/rooms/remove-participant.controller";
import { updateRoomController, deleteRoomController } from "@/lib/interface-adapters/controllers/rooms/room-settings.controller";
import { inviteToRoomController } from "@/lib/interface-adapters/controllers/rooms/invite-to-room.controller";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/impersonate.guard", () => ({ requireNoImpersonation: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/interface-adapters/controllers/rooms/get-sidebar-data.controller", () => ({ getSidebarDataController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/get-room-by-id.controller", () => ({ getRoomByIdController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/get-room-by-user-id.controller", () => ({ getRoomByUserIdController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/start-direct-message.controller", () => ({ startDirectMessageController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/create-room.controller", () => ({ createRoomController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/get-public-rooms.controller", () => ({ getPublicRoomsController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/join-room.controller", () => ({ joinRoomController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/remove-participant.controller", () => ({ removeParticipantController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/rooms/room-settings.controller", () => ({
  updateRoomController: vi.fn(),
  deleteRoomController: vi.fn(),
}));
vi.mock("@/lib/interface-adapters/controllers/rooms/invite-to-room.controller", () => ({
  searchInvitableUsersController: vi.fn(),
  inviteToRoomController: vi.fn(),
}));

describe("room.action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getSidebarData", () => {
    it("returns sidebar channels and DMs on success", async () => {
      const mockData = { channels: [{ id: "c1" } as any], directMessages: [] };
      vi.mocked(getSidebarDataController).mockResolvedValueOnce(mockData);

      const res = await getSidebarData("user1");
      expect(res).toEqual({ status: "success", data: mockData, error: null });
    });
  });

  describe("getRoom", () => {
    it("returns room details by id", async () => {
      const mockRoom = { id: "r1", name: "General" } as any;
      vi.mocked(getRoomByIdController).mockResolvedValueOnce(mockRoom);

      const res = await getRoom("r1");
      expect(res).toEqual({ status: "success", data: mockRoom, error: null });
    });
  });

  describe("createRoom (Direct Message)", () => {
    it("creates or returns existing DM room", async () => {
      const mockRoom = { id: "dm1", isDirect: true } as any;
      vi.mocked(startDirectMessageController).mockResolvedValueOnce({ room: mockRoom, action: "created" });

      const res = await createRoom("user1", "user2");
      expect(res).toEqual({ status: "success", data: mockRoom, error: null, meta: { action: "created" } });
    });
  });

  describe("createChannel", () => {
    it("creates a new channel", async () => {
      const mockRoom = { id: "ch1", name: "general", isDirect: false } as any;
      vi.mocked(createRoomController).mockResolvedValueOnce(mockRoom);

      const res = await createChannel("general", "user1", "desc", true);
      expect(res).toEqual({ status: "success", data: mockRoom, error: null });
      expect(createRoomController).toHaveBeenCalledWith({
        name: "general",
        isDirect: false,
        participantIds: ["user1"],
        description: "desc",
        isPublic: true,
        ownerId: "user1",
      });
    });
  });

  describe("joinRoom", () => {
    it("joins a room successfully", async () => {
      vi.mocked(joinRoomController).mockResolvedValueOnce(undefined as any);
      const res = await joinRoom("r1", "user1");
      expect(res).toEqual({ status: "success", data: true, error: null });
    });
  });

  describe("updateChannel", () => {
    it("updates channel data", async () => {
      vi.mocked(updateRoomController).mockResolvedValueOnce(undefined as any);
      const res = await updateChannel("r1", "user1", { name: "new-name" });
      expect(res).toEqual({ status: "success", data: true, error: null });
    });
  });

  describe("deleteChannel", () => {
    it("deletes a channel", async () => {
      vi.mocked(deleteRoomController).mockResolvedValueOnce(undefined as any);
      const res = await deleteChannel("r1", "user1");
      expect(res).toEqual({ status: "success", data: true, error: null });
    });
  });

  describe("inviteToChannel", () => {
    it("invites user to a channel", async () => {
      vi.mocked(inviteToRoomController).mockResolvedValueOnce(undefined as any);
      const res = await inviteToChannel("r1", "owner1", "user2");
      expect(res).toEqual({ status: "success", data: true, error: null });
    });
  });
});
