/**
 * Regex pattern to match URLs in text
 */
export const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

/**
 * Extract all unique URLs from a given text string,
 * ignoring URLs that are already part of an HTML tag attribute (like href="..." or src="...").
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];

  // 1. Remove URLs that are inside HTML attributes (href, src, etc.)
  // This regex matches things like href="url" or src='url' and removes them from the temporary text
  const cleanText = text.replace(/(href|src|cite|data-url)=["'](https?:\/\/[^"']+)["']/gi, "");

  // 2. Extract remaining URLs from the cleaned text
  const matches = cleanText.match(URL_REGEX);
  if (!matches) return [];
  
  // Return unique URLs only
  return Array.from(new Set(matches));
}
