import webpush from "web-push";
import { IWebPushService } from "@/lib/application/services/web-push.service.interface";
import { FcmPushService } from "./fcm-push.service";

export class WebPushService implements IWebPushService {
  private fcm = new FcmPushService();

  constructor() {
    webpush.setVapidDetails(
      "mailto:admin@komunikasi.qzz.io",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string
    );
  }

  async sendNotification(
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    payload: string
  ): Promise<void> {
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        // Subscription has expired or is no longer valid
        console.warn("Push subscription expired or invalid");
        // In a real app, you might want to trigger a cleanup in the repository here
        // or return a specific error so the Use Case can handle it.
      } else {
        console.error("Error sending push notification:", error);
      }
    }
  }

  async sendNativeNotification(
    token: string,
    payload: { title: string; body: string; url?: string }
  ): Promise<{ ok: boolean; expired: boolean }> {
    if (!this.fcm.isConfigured()) {
      // Not an error: FCM simply is not set up yet (no service account in env).
      return { ok: false, expired: false };
    }
    return this.fcm.sendToToken(token, payload);
  }
}
