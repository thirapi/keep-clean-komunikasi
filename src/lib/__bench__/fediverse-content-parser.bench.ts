/**
 * Benchmarks for the message rendering hot path.
 *
 * Run: npm run bench:content
 */
import { describe, bench } from "vitest";
import { parseFediverseContent } from "@/lib/fediverse-content-parser";
import { extractUrls } from "@/lib/extract-urls";

/**
 * The pre-optimisation implementation, kept here as the comparison baseline.
 * It compiled one RegExp per custom emoji inside the loop and ran a
 * full-string replace for each of them.
 */
function parseFediverseContentLegacy(
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

const message =
  "hey @bob can you check this? https://example.com/some/link and :party_parrot: :kappa: :FeelsGood: " +
  "**bold** _italic_ ~~strike~~ `code`\n> quoted line\n```js\nconst a = 1;\n```\n- one\n- two";

function buildEmojis(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `emoji_${i}`,
    url: `https://cdn.example.com/e/${i}.png`,
  }));
}

describe("parseFediverseContent", () => {
  bench("no emoji list (early return)", () => {
    parseFediverseContent(message, null);
  });

  bench("empty emoji list", () => {
    parseFediverseContent(message, []);
  });

  bench("20 emojis, 3 present in text", () => {
    parseFediverseContent(message, buildEmojis(20));
  });

  bench("200 emojis, 3 present in text", () => {
    parseFediverseContent(message, buildEmojis(200));
  });

  bench("200 emojis, all present in text", () => {
    const text = buildEmojis(200).map((e) => `:${e.name}:`).join(" ");
    parseFediverseContent(text, buildEmojis(200));
  });
});

describe("extractUrls", () => {
  bench("message with 1 url", () => {
    extractUrls(message);
  });
});

describe("parseFediverseContent: before vs after", () => {
  // 50 rendered messages is the default page size, so this is one full
  // message-list render pass over a room with 200 custom emojis.
  const PAGE = 50;
  const emojis = buildEmojis(200);
  const page = Array.from({ length: PAGE }, () => message);

  bench(`LEGACY  ${PAGE} messages x 200 emojis (one render pass)`, () => {
    for (const m of page) parseFediverseContentLegacy(m, emojis);
  });

  bench(`CURRENT ${PAGE} messages x 200 emojis (one render pass)`, () => {
    for (const m of page) parseFediverseContent(m, emojis);
  });
});
