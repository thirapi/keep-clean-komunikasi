export function parseFediverseContent(
    content: string,
    emojis?: { name: string; url: string }[] | null,
): string {
    if (!content) return "";

    let parsed = content;

    if (emojis && emojis.length > 0) {
        for (const emoji of emojis) {
            const regex = new RegExp(`:${emoji.name}:`, "g");
            parsed = parsed.replace(
                regex,
                `<img src="${emoji.url}" alt=":${emoji.name}:" class="fediverse-emoji inline-block h-[1.2em] w-[1.2em] align-text-bottom" />`,
            );
        }
    }

    return parsed;
}
