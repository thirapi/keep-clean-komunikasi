import "server-only";
import { GoogleAuth } from "google-auth-library";

/**
 * Firebase Cloud Messaging sender (HTTP v1).
 *
 * The legacy `fcm.googleapis.com/fcm/send` endpoint has been shut down by
 * Google, so HTTP v1 with a service account is the only supported path.
 *
 * FCM is delivered by Google Play Services, so devices without GMS (common on
 * Huawei, or degoogled ROMs) can never receive these. Web Push remains the
 * transport for those devices.
 */

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "";

const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? "";

/** A service account JSON, either inline or pointed at by path. */
function readServiceAccount(): Record<string, unknown> | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    try {
      return JSON.parse(inline);
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON", e);
      return null;
    }
  }
  return null;
}

export class FcmPushService {
  private auth: GoogleAuth | null;
  private configured: boolean;

  constructor() {
    const credentials = readServiceAccount();
    this.configured = Boolean(credentials) && Boolean(PROJECT_ID) && Boolean(CLIENT_EMAIL);
    this.auth = this.configured
      ? new GoogleAuth({
          credentials: credentials as never,
          scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
        })
      : null;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  /**
   * @returns true when the request was accepted, false when the token is dead
   * (the caller should delete it rather than retrying forever).
   */
  async sendToToken(
    token: string,
    payload: {
      title: string;
      body: string;
      url?: string;
    },
  ): Promise<{ ok: boolean; expired: boolean }> {
    if (!this.configured || !this.auth) {
      return { ok: false, expired: false };
    }

    try {
      const client = await this.auth.getClient();
      const token = await client.getAccessToken();
      const accessToken =
        typeof token === "string" ? token : token?.token;

      if (!accessToken) return { ok: false, expired: false };

      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: {
                title: payload.title,
                body: payload.body,
              },
              android: {
                priority: "high",
                notification: {
                  // Let the app be built from data, not a raw notification, so
                  // the JS listener decides how to present it (the current
                  // app already has a handler for that).
                  channel_id: "default",
                },
              },
              data: {
                title: payload.title,
                body: payload.body,
                url: payload.url ?? "/",
              },
            },
          }),
        },
      );

      if (res.ok) return { ok: true, expired: false };

      // 404 / 400 UNREGISTERED means the token is no longer valid.
      if (res.status === 404) return { ok: false, expired: true };
      if (res.status === 400) {
        const body = await res.text();
        if (body.includes("UNREGISTERED") || body.includes("INVALID_ARGUMENT")) {
          return { ok: false, expired: true };
        }
      }

      console.error(
        `FCM send failed: ${res.status} ${await res.text().catch(() => "")}`,
      );
      return { ok: false, expired: false };
    } catch (e) {
      console.error("FCM send error:", e);
      return { ok: false, expired: false };
    }
  }
}
