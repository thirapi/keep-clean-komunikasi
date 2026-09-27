const SHORTCODE_PATTERN = /:([^\s:]+):/g;

const lookupCache = new WeakMap<
    readonly { name: string; url: string }[],
    Map<string, string>
>();

function buildLookup(emojis: readonly { name: string; url: string }[]) {
    const cached = lookupCache.get(emojis);
    if (cached !== undefined) return cached;

    const lookup = new Map<string, string>();
    for (const emoji of emojis) {
        if (!emoji?.name || !emoji.url) continue;
        if (!lookup.has(emoji.name)) lookup.set(emoji.name, emoji.url);
    }

    lookupCache.set(emojis, lookup);
    return lookup;
}

function escapeAttributeValue(value: string) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function parseFediverseContent(
    content: string,
    emojis?: readonly { name: string; url: string }[] | null,
): string {
    if (!content) return "";

    if (!emojis || emojis.length === 0) return content;

    const lookup = buildLookup(emojis);
    if (lookup.size === 0) return content;

    SHORTCODE_PATTERN.lastIndex = 0;
    if (!SHORTCODE_PATTERN.test(content)) return content;
    SHORTCODE_PATTERN.lastIndex = 0;

    return content.replace(
        SHORTCODE_PATTERN,
        (match: string, name: string) => {
            const url = lookup.get(name);
            if (url === undefined) return match;
            return `<img src="${escapeAttributeValue(url)}" alt=":${name}:" class="fediverse-emoji inline-block h-[1.2em] w-[1.2em] align-text-bottom" />`;
        },
    );
}
