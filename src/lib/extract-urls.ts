/**
 * Extract all unique content URLs from a given text string (HTML or plain text).
 * Filters out Fediverse mentions, hashtags, and internal system links.
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];

  const urls: string[] = [];
  
  // 1. Semantic extraction from <a> tags (for HTML content)
  // Pattern to match <a> tags and capture their attributes and content
  const anchorRegex = /<a\s+([^>]+)>(.*?)<\/a>/gi;
  let anchorMatch;
  
  while ((anchorMatch = anchorRegex.exec(text)) !== null) {
    const attributes = anchorMatch[1];
    const content = anchorMatch[2];
    
    // Extract href
    const hrefMatch = /href=["'](https?:\/\/[^"']+)["']/i.exec(attributes);
    if (!hrefMatch) continue;
    
    const href = hrefMatch[1];
    const classMatch = /class=["']([^"']*)["']/i.exec(attributes);
    const className = classMatch ? classMatch[1] : "";
    
    // --- SEMANTIC EXCLUSION LIST ---
    // Skip Mentions
    if (className.includes("mention") || className.includes("u-url") || href.includes("/users/")) continue;
    
    // Skip Hashtags
    if (className.includes("hashtag") || href.includes("/tags/")) continue;
    
    // Skip Custom Emojis (anchor containing img)
    if (content.includes("<img")) continue;
    
    // Skip Internal Media Links (common patterns)
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'komunikasi.qzz.io';
    if (href.includes(currentDomain) && (href.includes("/attachments/") || href.includes("/media/"))) continue;

    urls.push(href);
  }

  // 2. Extract remaining URLs from plain text (ignoring already processed <a> tags)
  const textWithoutAnchors = text.replace(/<a[^>]*>.*?<\/a>/gi, " ");
  const strippedText = textWithoutAnchors.replace(/<[^>]*>/g, " ");
  
  const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
  const LOOSE_URL_REGEX = /\b(?:www\.|[a-zA-Z0-9-]+\.[a-z]{2,}\/)[-a-zA-Z0-9()@:%_\+.~#?&//=]*/gi;

  const textMatches = strippedText.match(URL_REGEX);
  if (textMatches) {
    textMatches.forEach(m => {
      const clean = m.replace(/[.,!?;:]+$/, "");
      urls.push(clean);
    });
  }

  const looseMatches = strippedText.match(LOOSE_URL_REGEX);
  if (looseMatches) {
    looseMatches.forEach(m => {
       const clean = m.replace(/[.,!?;:]+$/, "");
       const normalized = clean.startsWith('http') ? clean : 'https://' + clean;
       urls.push(normalized);
    });
  }
  
  // Return unique URLs only
  const uniqueUrls = Array.from(new Set(urls));
  
  return uniqueUrls.filter(u => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  });
}
