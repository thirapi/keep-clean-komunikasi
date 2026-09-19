import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateUserAction,
  changePasswordAction,
  searchUsersAction,
  getPublicProfileAction,
  getSharedMediaAction,
} from "../(with-sidebar)/user.action";

import { updateUserController } from "@/lib/interface-adapters/controllers/users/update.controller";
import { changePasswordController } from "@/lib/interface-adapters/controllers/users/change-password.controller";
import { searchUserController } from "@/lib/interface-adapters/controllers/users/search.controller";
import { getProfileController } from "@/lib/interface-adapters/controllers/users/get-profile.controller";
import { getSharedMediaController } from "@/lib/interface-adapters/controllers/users/get-shared-media.controller";

vi.mock("@/lib/impersonate.guard", () => ({ requireNoImpersonation: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/interface-adapters/controllers/users/update.controller", () => ({ updateUserController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/users/change-password.controller", () => ({ changePasswordController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/users/search.controller", () => ({ searchUserController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/users/get-profile.controller", () => ({ getProfileController: vi.fn() }));
vi.mock("@/lib/interface-adapters/controllers/users/get-shared-media.controller", () => ({ getSharedMediaController: vi.fn() }));
vi.mock("../auth.action", () => ({ getUserWithRolesFromSession: vi.fn().mockResolvedValue({ id: "user1" }) }));

describe("user.action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateUserAction", () => {
    it("updates user profile", async () => {
      vi.mocked(updateUserController).mockResolvedValueOnce(undefined as any);
      const res = await updateUserAction("user1", { name: "New Name" });
      expect(res).toEqual({ status: "success", data: null, error: null });
      expect(updateUserController).toHaveBeenCalledWith("user1", { name: "New Name" });
    });
  });

  describe("changePasswordAction", () => {
    it("changes password successfully", async () => {
      vi.mocked(changePasswordController).mockResolvedValueOnce(undefined as any);
      const res = await changePasswordAction("user1", { oldPassword: "old", newPassword: "new" });
      expect(res).toEqual({ status: "success", data: null, error: null });
    });

    it("returns error on failure", async () => {
      vi.mocked(changePasswordController).mockRejectedValueOnce(new Error("Wrong password"));
      const res = await changePasswordAction("user1", { oldPassword: "wrong", newPassword: "new" });
      expect(res).toEqual({
        status: "error",
        data: null,
        error: { type: "VALIDATION_ERROR", message: "Wrong password" },
      });
    });
  });

  describe("searchUsersAction", () => {
    it("searches users by query", async () => {
      const mockUsers = [{ id: "u2", username: "john", avatar: "a.png" }];
      vi.mocked(searchUserController).mockResolvedValueOnce(mockUsers as any);

      const res = await searchUsersAction("john");
      expect(res).toEqual({ status: "success", data: mockUsers, error: null });
    });
  });

  describe("getPublicProfileAction", () => {
    it("returns public profile of a user", async () => {
      const mockProfile = { id: "u1", username: "alice", name: "Alice" };
      vi.mocked(getProfileController).mockResolvedValueOnce(mockProfile as any);

      const res = await getPublicProfileAction("alice");
      expect(res).toEqual({ status: "success", data: mockProfile, error: null });
    });
  });

  describe("getSharedMediaAction", () => {
    it("returns shared media between users", async () => {
      const mockMedia = [{ id: "att1", url: "http://img.png" }] as any;
      vi.mocked(getSharedMediaController).mockResolvedValueOnce(mockMedia);

      const res = await getSharedMediaAction("u1", "alice");
      expect(res).toEqual({ status: "success", data: mockMedia, error: null });
    });
  });
});
