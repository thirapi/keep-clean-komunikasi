export interface IPushSubscriptionRepository {
  saveWebSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  ): Promise<void>;
  saveFcmToken(userId: string, token: string): Promise<void>;
  getSubscriptionsByUserId(userId: string): Promise<any[]>;
  getSubscriptionsByUserIds(userIds: string[]): Promise<any[]>;
  deleteSubscriptionById(id: string): Promise<void>;
  deleteSubscription(endpoint: string): Promise<void>;
}
