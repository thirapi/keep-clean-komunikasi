"use server";

import { db } from "@/lib/db";
import { UserRepository } from "@/lib/infrastructure/repositories/user.repository";
import { setImpersonation, clearImpersonation, getImpersonatedUserId } from "@/lib/impersonate.guard";
import { adminGuard } from "@/lib/middlewares/role-guard.middleware";
import { AuthenticationService } from "@/lib/infrastructure/services/authentication.service";
import { SessionRepository } from "@/lib/infrastructure/repositories/session.repository";
import { DrizzleActivityLogRepository } from "@/lib/infrastructure/repositories/activity-log.repository";
import { getUserSession } from "@/app/auth.action";

const userRepo = new UserRepository(db);
const authService = new AuthenticationService(
    new SessionRepository(db),
    userRepo,
    new DrizzleActivityLogRepository()
);

export async function startImpersonation(targetUserId: string) {
    const isAdmin = await adminGuard();
    if (!isAdmin) {
        return { status: "error", error: "Unauthorized" };
    }

    const targetUser = await userRepo.findById(targetUserId);
    if (!targetUser) {
        return { status: "error", error: "User not found" };
    }

    const session = await getUserSession();
    const adminId = session?.user?.id || "unknown";

    if (adminId === targetUserId) {
        return { status: "error", error: "Tidak bisa impersonate diri sendiri" };
    }

    await setImpersonation(targetUserId);

    await authService.logEvent({
        userId: targetUserId,
        category: "security",
        action: "impersonate_start",
        metadata: { impersonatedBy: adminId },
    });

    return { status: "success", username: targetUser.username };
}

export async function stopImpersonation() {
    await clearImpersonation();

    const impersonatedUserId = await getImpersonatedUserId();
    if (impersonatedUserId) {
        await authService.logEvent({
            userId: impersonatedUserId,
            category: "security",
            action: "impersonate_stop",
        });
    }

    return { status: "success" };
}

export async function getImpersonationStatus() {
    const impersonatedUserId = await getImpersonatedUserId();
    if (!impersonatedUserId) return null;

    const user = await userRepo.findById(impersonatedUserId);
    if (!user) return null;

    return {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
    };
}
