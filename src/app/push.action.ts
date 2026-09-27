"use server";

import { getUserSession } from "./auth.action";
import { PushSubscriptionRepository } from "@/lib/infrastructure/repositories/push-subscription.repository";

const pushSubscriptionRepository = new PushSubscriptionRepository();

export async function savePushSubscriptionAction(subscription: any) {
  const session = await getUserSession();
  if (!session?.user?.id) return { status: "error", error: "Unauthorized" };

  try {
    await pushSubscriptionRepository.saveWebSubscription(session.user.id, {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
    return { status: "success" };
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return { status: "error", error: "Internal Server Error" };
  }
}

/**
 * Register an FCM device token coming from the native Android app.
 * Web Push is a different transport and is stored separately.
 */
export async function saveFcmTokenAction(token: string) {
  const session = await getUserSession();
  if (!session?.user?.id) return { status: "error", error: "Unauthorized" };

  if (!token || typeof token !== "string" || token.length < 10) {
    return { status: "error", error: "Invalid token" };
  }

  try {
    await pushSubscriptionRepository.saveFcmToken(session.user.id, token);
    return { status: "success" };
  } catch (error) {
    console.error("Failed to save FCM token:", error);
    return { status: "error", error: "Internal Server Error" };
  }
}
