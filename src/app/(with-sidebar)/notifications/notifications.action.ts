"use server";

import { getUserSession } from "../../auth.action";
import { getNotificationsController, getUnreadNotificationsCountController } from "@/lib/interface-adapters/controllers/notifications/get-notifications.controller";
import { ServerResponse } from "@/lib/entities/models/response.model";

export async function getNotificationsAction(limit = 20, offset = 0): Promise<ServerResponse<any[]>> {
    const session = await getUserSession();
    if (!session?.user?.id) return { status: "error", error: { message: "Unauthorized", type: "AuthError" }, data: [] };

    try {
        const notifications = await getNotificationsController(session.user.id, limit, offset);
        return { status: "success", data: notifications, error: null };
    } catch (error: any) {
        return { status: "error", data: [], error: { message: error.message, type: error.constructor.name } };
    }
}

export async function getUnreadNotificationsCountAction(): Promise<ServerResponse<number>> {
    const session = await getUserSession();
    if (!session?.user?.id) return { status: "error", error: { message: "Unauthorized", type: "AuthError" }, data: 0 };

    try {
        const count = await getUnreadNotificationsCountController(session.user.id);
        return { status: "success", data: count, error: null };
    } catch (error: any) {
        return { status: "error", data: 0, error: { message: error.message, type: error.constructor.name } };
    }
}
