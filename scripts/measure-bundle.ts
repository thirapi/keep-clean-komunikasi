/**
 * Initial-load ("eager") client payload per route, from a production build.
 *
 * Next's client-reference manifest tags every client module with the chunks it
 * needs and an `async` flag: async=false means the chunk is part of the initial
 * load, async=true means it is only fetched on interaction. Summing the raw and
 * gzip sizes of the async=false chunks per route gives the number a browser
 * actually pays for before the page is interactive, which total static output
 * does not.
 *
 * Usage: npm run measure:bundle
 */
import { gzipSync } from "node:zlib";
import { existsSync, readFileSync, readdirSync, statSync, walkSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const nextDir = resolve(process.argv[2] ?? ".next");
const staticDir = join(nextDir, "static");

if (!existsSync(join(nextDir, "BUILD_ID"))) {
  console.error(`No production build at ${nextDir}. Run "npm run build" first.`);
  process.exit(1);
}

const CHUNK_RE = /"(\/[^"]*?\.js)"/g;

const sizes = new Map<string, number>();
const gzipCache = new Map<string, number>();

for (const entry of walkSync(staticDir)) {
  if (!entry.isFile()) continue;
  const rel = `/_next/${relative(nextDir, entry.path).split(/[\\/]/).join("/")}`;
  sizes.set(rel, entry.size);
}

function gzipSize(rel: string): number {
  const cached = gzipCache.get(rel);
  if (cached !== undefined) return cached;
  const p = join(nextDir, rel.replace("/_next/", ""));
  const size = existsSync(p) ? gzipSync(readFileSync(p), { level: 6 }).length : 0;
  gzipCache.set(rel, size);
  return size;
}

interface RouteStat {
  route: string;
  chunks: number;
  raw: number;
  gzip: number;
}

function collect(manifestPath: string, route: string): RouteStat {
  const src = readFileSync(manifestPath, "utf8");
  const eager = new Set<string>();
  for (const m of src.matchAll(/"chunks":\[([^\]]*)\]\s*,\s*"async":(true|false)/g)) {
    if (m[2] === "false") {
      for (const c of m[1].matchAll(CHUNK_RE)) eager.add(c[1]);
    }
  }
  let raw = 0;
  let gzip = 0;
  for (const c of eager) {
    raw += sizes.get(c) ?? 0;
    gzip += gzipSize(c);
  }
  return { route, chunks: eager.size, raw, gzip };
}

const rows: RouteStat[] = [];
for (const dir of walkSync(join(nextDir, "server", "app"))) {
  if (!dir.isDirectory()) continue;
  const manifest = join(dir.path, "page_client-reference-manifest.js");
  if (!existsSync(manifest)) continue;
  const rel = relative(join(nextDir, "server", "app"), dir.path)
    .split(/[\\/]/)
    .join("/")
    .replace(/\/page$/, "");
  rows.push(collect(manifest, rel));
}

rows.sort((a, b) => b.raw - a.raw);

const kb = (n: number) => (n / 1024).toFixed(1);
const pad = (s: string | number, n: number) => String(s).padStart(n);

console.log(`initial-load client payload — ${nextDir}\n`);
console.log(`${"route".padEnd(46)}${pad("chunks", 8)}${pad("raw KB", 11)}${pad("gzip KB", 11)}`);
console.log("-".repeat(76));
for (const r of rows) {
  console.log(`${r.route.padEnd(46)}${pad(r.chunks, 8)}${pad(kb(r.raw), 11)}${pad(kb(r.gzip), 11)}`);
}
const totalRaw = rows.reduce((n, r) => n + r.raw, 0);
const totalGzip = rows.reduce((n, r) => n + r.gzip, 0);
console.log("-".repeat(76));
console.log(
  `${"TOTAL across routes".padEnd(46)}${pad("", 8)}${pad(kb(totalRaw), 11)}${pad(kb(totalGzip), 11)}`,
);
