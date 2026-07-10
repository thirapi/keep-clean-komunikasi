"use server";

import { requireNoImpersonation } from "@/lib/impersonate.guard";
import { ServerResponse } from "@/lib/entities/models/response.model";
import { UserRecord } from "@/lib/entities/models/user.model";
import { updateUserController } from "@/lib/interface-adapters/controllers/users/update.controller";
import { searchUserController } from "@/lib/interface-adapters/controllers/users/search.controller";
import { changePasswordController } from "@/lib/interface-adapters/controllers/users/change-password.controller";
import { getProfileController } from "@/lib/interface-adapters/controllers/users/get-profile.controller";

export const updateUserAction = async (
  userId: string,
  user: Partial<UserRecord>
): Promise<ServerResponse<null>> => {
  try {
    await requireNoImpersonation();
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
    const fullCurrentUser = await (await import("../auth.action")).getUserWithRolesFromSession();
    const users = await searchUserController(query, 10, fullCurrentUser?.id);
    return {
      status: "success",
      data: users as any,
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
