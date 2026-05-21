"use server";

import { ServerResponse } from "@/lib/entities/models/response.model";
import { UserRecord } from "@/lib/entities/models/user.model";
import { updateUserController } from "@/lib/interface-adapters/controllers/users/update.controller";
import { searchUserController } from "@/lib/interface-adapters/controllers/users/search.controller";
import { changePasswordController } from "@/lib/interface-adapters/controllers/users/change-password.controller";
import { getProfileController } from "@/lib/interface-adapters/controllers/users/get-profile.controller";
import { followUserController } from "@/lib/interface-adapters/controllers/users/follow-user.controller";
import { unfollowUserController } from "@/lib/interface-adapters/controllers/users/unfollow-user.controller";
import { FollowerRepository } from "@/lib/infrastructure/repositories/follower.repository";
import { db } from "@/lib/db";

export const updateUserAction = async (
  userId: string,
  user: Partial<UserRecord>
): Promise<ServerResponse<null>> => {
  try {
    await updateUserController(userId, user);

    return {
      status: "success",
      data: null,
      error: null,
    };
  } catch (err: any) {
    console.error(err);
    return {
      status: "error",
      data: null,
      error: {
        type: "UNKNOWN_ERROR",
        message: err.message || "Something went wrong",
      },
    };
  }
};

export const changePasswordAction = async (
  userId: string,
  data: { oldPassword?: string; newPassword: string }
): Promise<ServerResponse<null>> => {
  try {
    await changePasswordController(userId, data);
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
        type: "VALIDATION_ERROR",
        message: err.message,
      },
    };
  }
};

export const searchUsersAction = async (query: string): Promise<ServerResponse<{ id: string; username: string; avatar: string }[]>> => {
  try {
    const users = await searchUserController(query);
    return {
      status: "success",
      data: users,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: [],
      error: {
        type: "UNKNOWN_ERROR",
        message: err.message,
      },
    };
  }
};

export const getPublicProfileAction = async (username: string, currentUserId?: string): Promise<ServerResponse<any>> => {
  try {
    const user = await getProfileController(username, currentUserId);
    return {
      status: "success",
      data: user,
      error: null,
    };
  } catch (err: any) {
    return {
      status: "error",
      data: null,
      error: {
        type: "UNKNOWN_ERROR",
        message: err.message || "User not found",
      },
    };
  }
};

export const followUserAction = async (followerId: string, followingId: string): Promise<ServerResponse<null>> => {
  try {
    await followUserController(followerId, followingId);
    return { status: "success", data: null, error: null };
  } catch (err: any) {
    return { status: "error", data: null, error: { type: "UNKNOWN_ERROR", message: err.message } };
  }
};

export const unfollowUserAction = async (followerId: string, followingId: string): Promise<ServerResponse<null>> => {
  try {
    await unfollowUserController(followerId, followingId);
    return { status: "success", data: null, error: null };
  } catch (err: any) {
    return { status: "error", data: null, error: { type: "UNKNOWN_ERROR", message: err.message } };
  }
};

export const checkFollowingStatusAction = async (followerId: string, followingId: string): Promise<ServerResponse<boolean>> => {
  try {
    const repo = new FollowerRepository(db);
    const result = await repo.isFollowing(followerId, followingId);
    return { status: "success", data: result, error: null };
  } catch (err: any) {
    return { status: "error", data: false, error: { type: "UNKNOWN_ERROR", message: err.message } };
  }
};
