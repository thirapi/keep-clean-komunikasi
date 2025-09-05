"use server";

import { ServerResponse } from "@/lib/entities/models/response.model";
import { UserRecord } from "@/lib/entities/models/user.model";
import { updateUserController } from "@/lib/interface-adapters/controllers/users/update.controller";

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
