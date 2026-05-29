import { ActivityPubFetchService } from "./activitypub-fetch.service";

export class WebFingerService {
  /**
   * Resolve an ActivityPub Actor URI from a handle (e.g., @user@domain.com)
   */
  static async resolveHandle(handle: string, currentUserId?: string): Promise<string | null> {
    try {
      const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;
      const parts = cleanHandle.split("@");
      
      if (parts.length !== 2) return null;
      
      const [username, domain] = parts;
      
      // Use standard acct: resource format. 
      // We encode ONLY the username and domain part to keep 'acct:' plain, 
      // which improves compatibility with some strict instances like Misskey.
      const resource = `acct:${username}@${domain}`;
      const webfingerUrl = `https://${domain}/.well-known/webfinger?resource=${encodeURIComponent(resource)}`;
      
      console.log(`[WebFinger] Resolving ${handle} via ${webfingerUrl} (Signed)`);

      // We use Signed Fetch even for WebFinger as it improves reputation with strict instances
      const response = await ActivityPubFetchService.fetch(webfingerUrl, {
        headers: {
            "Accept": "application/jrd+json, application/json"
        },
        cache: "no-store"
      }, currentUserId);
      
      if (!response.ok) {
        console.error(`[WebFinger] Failed for ${handle}: ${response.status} ${response.statusText}`);
        
        // Fallback to unsigned if signed failed (some instances might block signed GET on WebFinger)
        if (response.status === 401 || response.status === 403) {
            console.log(`[WebFinger] Retrying unsigned for ${handle}`);
            const unsignedRes = await ActivityPubFetchService.fetchUnsigned(webfingerUrl, {
                headers: { "Accept": "application/jrd+json, application/json" }
            });
            if (unsignedRes.ok) {
                const data = await unsignedRes.json();
                return this.extractSelfLink(data);
            }
        }
        return null;
      }
      
      const data = await response.json();
      return this.extractSelfLink(data);
    } catch (err) {
      console.error(`[WebFinger] Exception for ${handle}:`, err);
      return null;
    }
  }

  private static extractSelfLink(data: any): string | null {
    const selfLink = data.links?.find((l: any) => 
        l.rel === "self" && 
        (l.type === "application/activity+json" || l.type === "application/ld+json")
    );
    return selfLink?.href || null;
  }
}
