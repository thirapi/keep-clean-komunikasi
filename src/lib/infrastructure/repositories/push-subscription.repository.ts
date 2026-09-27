import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/infrastructure/drizzle/schema";
import { IPushSubscriptionRepository } from "@/lib/application/repositories/push-subscription.repository.interface";
import { eq, and, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type PushTransport = "web" | "fcm";

export class PushSubscriptionRepository implements IPushSubscriptionRepository {
  async saveWebSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    }
  ): Promise<void> {
    await this.upsert(userId, "web", subscription.endpoint, {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
  }

  /** An FCM token is a bare string: no endpoint URL, no keys. */
  async saveFcmToken(userId: string, token: string): Promise<void> {
    await this.upsert(userId, "fcm", token, { p256dh: null, auth: null });
  }

  private async upsert(
    userId: string,
    type: PushTransport,
    endpoint: string,
    keys: { p256dh: string | null; auth: string | null }
  ): Promise<void> {
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.type, type),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(pushSubscriptions)
        .set({ ...keys, updatedAt: new Date() })
        .where(eq(pushSubscriptions.id, existing[0].id));
    } else {
      await db.insert(pushSubscriptions).values({
        id: createId(),
        userId,
        type,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }
  }

  async getSubscriptionsByUserId(userId: string): Promise<any[]> {
    return db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  async getSubscriptionsByUserIds(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];
    return db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, userIds));
  }

  async deleteSubscriptionById(id: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  }

  async deleteSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }
}
