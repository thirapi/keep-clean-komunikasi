export function parseFediverseContent(content: string, emojis: { name: string; url: string }[] | null | undefined): string {
    if (!content || !emojis || emojis.length === 0) return content;

    // Create a map for fast lookup and normalize shortcodes
    const emojiMap = new Map<string, string>();
    emojis.forEach(emoji => {
        const shortcode = emoji.name.startsWith(':') ? emoji.name : `:${emoji.name}:`;
        emojiMap.set(shortcode, emoji.url);
    });

    // Single-pass replacement: Match HTML tags (to skip them) or shortcodes
    // This ensures we don't replace shortcodes inside alt/title attributes of existing tags
    return content.replace(/(<[^>]+>)|(:[a-zA-Z0-9_-]+:)/g, (match, tag, shortcode) => {
        if (tag) return tag; // Return HTML tags unchanged
        
        const emojiUrl = emojiMap.get(shortcode);
        if (emojiUrl) {
            return `<img src="${emojiUrl}" alt="${shortcode}" title="${shortcode}" class="fediverse-emoji inline-block h-[1.4em] w-[1.4em] align-text-bottom mx-0.5" />`;
        }
        
        return match; // Return as is if no emoji found
    });
}
