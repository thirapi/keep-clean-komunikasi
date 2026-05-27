export class WebFingerService {
  /**
   * Resolve an ActivityPub Actor URI from a handle (e.g., @user@domain.com)
   */
  static async resolveHandle(handle: string): Promise<string | null> {
    try {
      const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;
      const parts = cleanHandle.split("@");
      
      if (parts.length !== 2) return null;
      
      const [username, domain] = parts;
      const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=acct:${username}@${domain}`;
      
      console.log(`[WebFinger] Resolving ${handle} via ${webfingerUrl}`);

      const response = await fetch(webfingerUrl, {
        headers: { 
          "Accept": "application/jrd+json",
          "User-Agent": "Komunikasi/1.0 (+https://komunikasi.qzz.io)"
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      });
      
      if (!response.ok) {
        console.error(`[WebFinger] Failed for ${handle}: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      const selfLink = data.links?.find((l: any) => l.rel === "self" && l.type === "application/activity+json");
      
      return selfLink?.href || null;
    } catch (err) {
      console.error(`[WebFinger] Exception for ${handle}:`, err);
      return null;
    }
  }
}
