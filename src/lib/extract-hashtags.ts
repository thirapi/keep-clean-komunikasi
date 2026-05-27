/**
 * Extract all unique hashtags from a given text string
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  // Matches hashtags (words starting with #)
  const HASHTAG_REGEX = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(HASHTAG_REGEX);
  if (!matches) return [];
  
  // Return unique, lowercased hashtags without the #
  return Array.from(new Set(matches.map(m => m.substring(1).toLowerCase())));
}
