"use server";

import { getUserSession } from "./auth.action";
import { PushSubscriptionRepository } from "@/lib/infrastructure/repositories/push-subscription.repository";

const pushSubscriptionRepository = new PushSubscriptionRepository();

export async function savePushSubscriptionAction(subscription: any) {
  const session = await getUserSession();
  if (!session?.user?.id) return { status: "error", error: "Unauthorized" };

  try {
    await pushSubscriptionRepository.saveSubscription(session.user.id, {
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
