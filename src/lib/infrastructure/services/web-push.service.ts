import webpush from "web-push";
import { IWebPushService } from "@/lib/application/services/web-push.service.interface";

export class WebPushService implements IWebPushService {
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
}
