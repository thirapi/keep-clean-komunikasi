export function parseFediverseContent(content: string, emojis: { name: string; url: string }[] | null | undefined): string {
    if (!content || !emojis || emojis.length === 0) return content;

    let parsedContent = content;
    
    // Sort emojis by name length descending to avoid partial matches (e.g. :cat: vs :cat_heart:)
    const sortedEmojis = [...emojis].sort((a, b) => b.name.length - a.name.length);

    sortedEmojis.forEach(emoji => {
        // Handle both ":name:" and "name" formats
        const shortcode = emoji.name.startsWith(':') ? emoji.name : `:${emoji.name}:`;
        
        // Escape for regex
        const escapedName = shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedName, 'g');
        
        const imgTag = `<img src="${emoji.url}" alt="${shortcode}" title="${shortcode}" class="fediverse-emoji inline-block h-[1.2em] w-[1.2em] align-text-bottom mx-0.5" />`;
        parsedContent = parsedContent.replace(regex, imgTag);
    });

    return parsedContent;
}
