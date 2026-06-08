"use server";

import {
  AuthenticationError,
  InputParsedError,
} from "@/lib/entities/errors/common";
import { ServerResponse } from "@/lib/entities/models/response.model";
import { SignUpUserDTO } from "@/lib/entities/models/user.model";
import { SessionDTO } from "@/lib/entities/models/session.model";
import { signInController } from "@/lib/interface-adapters/controllers/sign-in.controller";
import { signUpController } from "@/lib/interface-adapters/controllers/sign-up.controller";
import { getUserSessionController } from "@/lib/interface-adapters/controllers/get-session.controller";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { signOutController } from "@/lib/interface-adapters/controllers/sign-out.controller";
import { getUserWithRolesController } from "@/lib/interface-adapters/controllers/roles/get-user-role.controller";
import { NextRequest } from "next/server";

const getContext = async () => {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "unknown";
  const userAgent = headerList.get("user-agent") || "unknown";
  return { ip, userAgent };
};

export const signInUser = async (
  username: string,
  password: string,
  callbackUrl?: string
): Promise<ServerResponse<null>> => {
  try {
    const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
    const context = await getContext();
    const response = await signInController({ username, password }, context);
    const cookieStore = await cookies();

    if (response) {
      cookieStore.set("session_id", response, {
        httpOnly: true,
        maxAge: COOKIE_MAX_AGE,
      });
    } else {
      throw new AuthenticationError("Error creating session!");
    }
    
    if (callbackUrl && callbackUrl.startsWith("/")) {
      redirect(callbackUrl);
    } else {
      redirect("/channels/default");
    }
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") throw err;
    if (err instanceof AuthenticationError) {
      return {
        status: "error",
        data: null,
        error: {
          message: err.message,
          type: err.name,
        },
      };
    }

    if (err instanceof InputParsedError) {
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
    console.log(err);
    return {
      status: "error",
      data: null,
      error: {
        message: "Something went wrong",
        type: "UNKNOWN_ERROR",
      },
    };
  }
};

export const signUpUser = async (
  username: string,
  password: string,
  confirm_password: string,
  callbackUrl?: string
): Promise<ServerResponse<null>> => {
  try {
    const signUpData: SignUpUserDTO = {
      username,
      password,
      confirm_password,
    };
    await signUpController(signUpData);
    if (callbackUrl) {
      redirect(`/?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } else {
      redirect("/");
    }
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") throw err;
    if (err instanceof AuthenticationError) {
      return {
        status: "error",
        data: null,
        error: {
          message: err.message,
          type: err.name,
        },
      };
    }

    if (err instanceof InputParsedError) {
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
    console.log(err);
    return {
      status: "error",
      data: null,
      error: {
        message: "Something went wrong",
        type: "UNKNOWN_ERROR",
      },
    };
  }
};

export const signOutUserAction = async () => {
  const cookieStore = await cookies();
  const session_id = cookieStore.get("session_id");
  if (!session_id) {
    return null;
  }
  const context = await getContext();
  await signOutController(session_id.value, context);
  cookieStore.delete("session_id");
  redirect("/");
};

export const getUserSession = cache(async (): Promise<SessionDTO | null> => {
  const session_id = (await cookies()).get("session_id");
  if (!session_id) {
    return null;
  }
  const context = await getContext();
  const response = await getUserSessionController(session_id.value, context);
  if (response.session) {
    return response;
  } else {
    return null;
  }
});

export const sidaBarUserInfo = async () => {
  const session = await getUserSession();

  const userData = await getUserWithRolesController(session);

  const getRolesAsString = (roles: { id: string; name: string }[]): string => {
    return roles.map((role) => role.name).join(", ");
  };

  if (session && userData) {
    return {
      name: userData.name || userData.username,
      username: userData.username,
      role: getRolesAsString(userData.roles),
      email: "komunikasi.qzz.io",
      avatar: userData.avatar || "/avatars/avatar1.png",
      bio: userData.bio,
      banner: userData.banner,
      customStatus: userData.customStatus,
      alsoKnownAs: userData.alsoKnownAs,
      movedTo: userData.movedTo,
    };
  } else {
    return {
      name: "error",
      username: "error",
      role: "",
      email: "",
      avatar: "/avatars/avatar1.png",
    };
  }
};

export const getUserWithRolesFromSession = async () => {
  const session = await getUserSession();
  const userWithRoles = await getUserWithRolesController(session);

  return userWithRoles;
};

export async function getUserSessionFromRequest(
  req: NextRequest
): Promise<SessionDTO | null> {
  const session_id = req.cookies.get("session_id")?.value;

  if (!session_id) return null;

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  const response = await getUserSessionController(session_id, { ip, userAgent });
  return response ?? null;
}
