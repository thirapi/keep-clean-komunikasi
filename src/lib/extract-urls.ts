/**
 * Regex pattern to match URLs with protocol
 */
export const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

/**
 * Regex for protocol-less URLs (e.g. x.com/path, www.google.com)
 * We require it to start with www. OR have a path component to avoid matching things like "v1.2"
 */
export const LOOSE_URL_REGEX = /\b(?:www\.|[a-zA-Z0-9-]+\.[a-z]{2,}\/)[-a-zA-Z0-9()@:%_\+.~#?&//=]*/gi;

/**
 * Extract all unique URLs from a given text string,
 * including URLs in href attributes and plain text.
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];

  const urls: string[] = [];
  
  // 1. Extract from href attributes (common in Fediverse HTML content)
  const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(text)) !== null) {
    urls.push(match[1]);
  }

  // 2. Extract remaining URLs from the text
  // We strip tags for text extraction to avoid matching URLs in other attributes
  const strippedText = text.replace(/<[^>]*>/g, " ");
  
  // Match URLs with protocol
  const textMatches = strippedText.match(URL_REGEX);
  if (textMatches) {
    textMatches.forEach(m => {
      // Remove trailing punctuation common in sentences
      const clean = m.replace(/[.,!?;:]+$/, "");
      urls.push(clean);
    });
  }

  // Match protocol-less URLs
  const looseMatches = strippedText.match(LOOSE_URL_REGEX);
  if (looseMatches) {
    looseMatches.forEach(m => {
       // Remove trailing punctuation
       const clean = m.replace(/[.,!?;:]+$/, "");
       // Only add if it doesn't already have a protocol
       // and prepend https:// if missing
       const normalized = clean.startsWith('http') ? clean : 'https://' + clean;
       urls.push(normalized);
    });
  }
  
  // Return unique URLs only
  const uniqueUrls = Array.from(new Set(urls));
  
  // Filter out invalid URLs and ensure they look like real web URLs
  return uniqueUrls.filter(u => {
    try {
      const parsed = new URL(u);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  });
}
