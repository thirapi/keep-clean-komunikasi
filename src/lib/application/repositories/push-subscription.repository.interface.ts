export interface IPushSubscriptionRepository {
  saveSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    }
  ): Promise<void>;
  
  getSubscriptionsByUserId(userId: string): Promise<any[]>;
  
  deleteSubscription(endpoint: string): Promise<void>;
}
