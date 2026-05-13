import { ILinkPreviewService, LinkPreview } from "@/lib/application/services/link-preview.service.interface";

export class LinkPreviewService implements ILinkPreviewService {
  async getPreview(url: string): Promise<LinkPreview | null> {
    try {
      const response = await fetch(url, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(5000),
      });
      const html = await response.text();

      const getMeta = (nameOrProperty: string) => {
        // More restrictive regex that ensures we stay within one tag [^>]*? and handles quotes better
        const patterns = [
          new RegExp(`<meta\\s+[^>]*?(?:property|name)=["']${nameOrProperty}["'][^>]*?content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta\\s+[^>]*?content=["']([^"']*)["'][^>]*?(?:property|name)=["']${nameOrProperty}["']`, "i")
        ];
        
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match && match[1]) return this.decodeHtmlEntities(match[1]);
        }
        return null;
      };

      const title = getMeta("og:title") || 
                    getMeta("twitter:title") ||
                    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || 
                    url;
      
      const description = getMeta("og:description") || 
                          getMeta("twitter:description") ||
                          getMeta("description") || 
                          "";
      
      const image = getMeta("og:image") || 
                    getMeta("twitter:image:src") || 
                    getMeta("twitter:image") || 
                    "";
      
      const siteName = getMeta("og:site_name") || 
                       getMeta("twitter:site") ||
                       "";

      const themeColor = getMeta("theme-color") || "";

      // Improved favicon extraction
      let favicon = "";
      const faviconPatterns = [
        /<link[^>]*?rel=["'](?:shortcut )?icon["'][^>]*?href=["']([^"']*)["']/i,
        /<link[^>]*?href=["']([^"']*)["'][^>]*?rel=["'](?:shortcut )?icon["']/i,
        /<link[^>]*?rel=["']icon["'][^>]*?href=["']([^"']*)["']/i
      ];

      for (const pattern of faviconPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          favicon = match[1];
          break;
        }
      }

      if (favicon && !favicon.startsWith("http")) {
        try {
          const urlObj = new URL(url);
          favicon = new URL(favicon, urlObj.origin).href;
        } catch {
          favicon = "";
        }
      } else if (!favicon) {
        try {
          const urlObj = new URL(url);
          favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
        } catch {}
      }

      return {
        title: this.decodeHtmlEntities(title).trim(),
        description: this.decodeHtmlEntities(description).trim(),
        image,
        url,
        siteName: this.decodeHtmlEntities(siteName).trim(),
        favicon,
        themeColor
      };
    } catch (error) {
      console.error("Link preview fetch failed:", error);
      return null;
    }
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&ndash;/g, "–")
      .replace(/&mdash;/g, "—")
      .replace(/\s+/g, " ");
  }
}
