export function parseFediverseContent(content: string, emojis: { name: string; url: string }[] | null | undefined): string {
    if (!content || !emojis || emojis.length === 0) return content;

    let parsedContent = content;
    emojis.forEach(emoji => {
        // Escape name for regex (e.g. :blob_cat:)
        const escapedName = emoji.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedName, 'g');
        // We use a specific class for custom emojis to control their size
        const imgTag = `<img src="${emoji.url}" alt="${emoji.name}" title="${emoji.name}" class="fediverse-emoji inline-block h-[1.2em] w-[1.2em] align-text-bottom mx-0.5" />`;
        parsedContent = parsedContent.replace(regex, imgTag);
    });

    return parsedContent;
}
