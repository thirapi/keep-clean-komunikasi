/**
 * What does each remark/rehype plugin cost, measured on the message-rendering
 * hot path? Used to decide whether rehype-raw (raw HTML parsing, and an XSS
 * surface) earns its place in the eager client bundle.
 *
 * Run: npx tsx scripts/measure-markdown-pipeline.ts
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const SAMPLES = [
  "hello world",
  "**bold** and _italic_ and ~~strike~~ and `code`",
  "# Heading\n\nParagraph with a [link](https://example.com) and a list:\n\n- one\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |",
  "```js\nconst a = 1;\nconsole.log(a);\n```",
  "> greentext line\nplain line\nmore plain",
  "Check this out https://youtube.com/watch?v=dQw4w9WgXcQ and https://x.com/foo/status/1234567890",
  "<b>raw html</b> and <img src=x onerror=alert(1)>",
  "line one\nline two\nline three\n\n> quote\n\n~~strike across lines~~",
];

const VARIANTS: { name: string; plugins: any[] }[] = [
  { name: "remarkParse only (baseline)", plugins: [] },
  { name: "+ remarkGfm", plugins: [remarkGfm] },
  { name: "+ remarkGfm + remarkBreaks", plugins: [remarkGfm, remarkBreaks] },
  { name: "+ remarkGfm + remarkBreaks + rehypeRaw", plugins: [remarkGfm, remarkBreaks, rehypeRaw] },
];

const ITERATIONS = 400;

function bench(name: string, fn: () => void) {
  for (let i = 0; i < 40; i++) fn(); // warm
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const t1 = process.hrtime.bigint();
  const msPerPass = Number(t1 - t0) / 1e6 / ITERATIONS;
  const usPerDoc = (msPerPass * 1000) / SAMPLES.length;
  console.log(
    `${name.padEnd(42)} ${msPerPass.toFixed(3).padStart(8)} ms/pass  ${usPerDoc.toFixed(1).padStart(7)} us/doc`,
  );
  return msPerPass;
}

async function main() {
  console.log(`markdown pipeline cost — ${ITERATIONS} passes x ${SAMPLES.length} documents\n`);

  const results: Record<string, number> = {};

  for (const v of VARIANTS) {
    // rehypeRaw only makes sense after remarkRehype has kept the raw HTML
    // nodes, which is exactly the extra parse it then has to redo.
    const processor = unified()
      .use(remarkParse)
      .use(...(v.plugins as [any]))
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true });

    results[v.name] = bench(v.name, () => {
      for (const s of SAMPLES) processor.processSync(s);
    });
  }

  console.log("");
  const base = results["remarkParse only (baseline)"];
  const withGfm = results["+ remarkGfm"];
  const withBreaks = results["+ remarkGfm + remarkBreaks"];
  const withRaw = results["+ remarkGfm + remarkBreaks + rehypeRaw"];

  const pct = (a: number, b: number) => (((a - b) / a) * 100).toFixed(1);
  console.log(`rehypeRaw adds        ${(withRaw - withBreaks).toFixed(3)} ms/pass  (+${pct(withRaw, withBreaks)}%)`);
  console.log(`remarkGfm adds        ${(withGfm - base).toFixed(3)} ms/pass  (+${pct(withGfm, base)}%)`);
  console.log(`remarkBreaks adds     ${(withBreaks - withGfm).toFixed(3)} ms/pass  (+${pct(withBreaks, withGfm)}%)`);

  // How does rehypeRaw behave on documents with no raw HTML at all?
  const noHtml = SAMPLES.filter((s) => !s.includes("<"));
  const procNoRaw = unified().use(remarkParse).use(remarkGfm).use(remarkBreaks).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeStringify, { allowDangerousHtml: true });
  const procRaw = unified().use(remarkParse).use(remarkGfm).use(remarkBreaks).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw).use(rehypeStringify, { allowDangerousHtml: true });

  const timeSet = (p: any, docs: string[]) => {
    for (let i = 0; i < 40; i++) for (const s of docs) p.processSync(s);
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < ITERATIONS; i++) for (const s of docs) p.processSync(s);
    return Number(process.hrtime.bigint() - t0) / 1e6 / ITERATIONS;
  };

  const a = timeSet(procNoRaw, noHtml);
  const b = timeSet(procRaw, noHtml);
  console.log("");
  console.log(`on documents WITHOUT raw html (${noHtml.length} docs):`);
  console.log(`  without rehypeRaw ${a.toFixed(3)} ms/pass, with rehypeRaw ${b.toFixed(3)} ms/pass ` +
    `(+${(((b - a) / a) * 100).toFixed(1)}% pure overhead)`);
}

main();
