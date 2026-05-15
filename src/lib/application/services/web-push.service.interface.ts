export interface IWebPushService {
  sendNotification(
    subscription: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
    },
    payload: string
  ): Promise<void>;
}
