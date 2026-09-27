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

  /**
   * Fire a notification to a FCM device token (native Android app).
   * @returns ok=false with expired=true when the token is dead and should be removed.
   */
  sendNativeNotification(
    token: string,
    payload: { title: string; body: string; url?: string }
  ): Promise<{ ok: boolean; expired: boolean }>;
}
