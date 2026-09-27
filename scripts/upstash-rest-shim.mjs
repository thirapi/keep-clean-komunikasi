/**
 * Local Upstash-compatible Redis endpoint backed by real Redis, for verifying
 * the presence + session-throttle code paths without a cloud account.
 *
 * @upstash/redis speaks the Upstash REST protocol (POST / with a JSON array of
 * command parts). This serves the handful of commands the app uses, records
 * every command it received, and executes them against a real Redis over RESP.
 *
 * Usage: node scripts/upstash-rest-shim.mjs <port> <redisPort>
 */
import { createServer } from "node:http";
import { createConnection } from "node:net";

const PORT = Number(process.argv[2] ?? 58100);
const REDIS_PORT = Number(process.argv[3] ?? 56379);

function respEncode(args) {
  let out = `*${args.length}\r\n`;
  for (const a of args) {
    const s = String(a);
    out += `$${Buffer.byteLength(s)}\r\n${s}\r\n`;
  }
  return out;
}

function writeCommand(args) {
  return new Promise((resolve, reject) => {
    const sock = createConnection({ host: "127.0.0.1", port: REDIS_PORT }, () => {
      sock.write(respEncode(args));
    });
    let buf = Buffer.alloc(0);
    sock.on("data", (d) => {
      buf = Buffer.concat([buf, d]);
      // The first reply is enough for a single command; leave the socket to die.
      sock.end();
      resolve(buf.toString("utf8"));
    });
    sock.on("error", reject);
    setTimeout(() => { sock.destroy(); resolve(""); }, 2000);
  });
}

/** Parse a minimal RESP reply into a JS value. */
function parseResp(s) {
  if (!s) return null;
  const t = s[0];
  if (t === "+") return s.slice(1).split("\r\n")[0];
  if (t === "-") return new Error(s.slice(1).split("\r\n")[0]);
  if (t === ":") return Number(s.slice(1).split("\r\n")[0]);
  if (t === "$") {
    const len = Number(s.slice(1).split("\r\n")[0]);
    if (len === -1) return null;
    const rest = s.slice(s.indexOf("\r\n", 1) + 2);
    return rest.slice(0, len);
  }
  if (t === "*") {
    const n = Number(s.slice(1).split("\r\n")[0]);
    if (n === -1) return null;
    const items = [];
    let rest = s.slice(s.indexOf("\r\n", 1) + 2);
    for (let i = 0; i < n; i++) {
      const len = Number(rest.slice(1).split("\r\n")[0]);
      if (len === -1) { items.push(null); rest = rest.slice(rest.indexOf("\r\n", 1) + 2); continue; }
      const start = rest.indexOf("\r\n", 1) + 2;
      items.push(rest.slice(start, start + len));
      rest = rest.slice(start + len + 2);
    }
    return items;
  }
  return s;
}

const seen = [];

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    let payload;
    try { payload = JSON.parse(body); } catch { payload = []; }
    // Upstash allows ["PIPELINE", [cmd...], [cmd...]]
    const commands = Array.isArray(payload) && payload[0] === "PIPELINE" ? payload.slice(1) : [payload];
    const results = [];
    for (const cmd of commands) {
      const parts = Array.isArray(cmd) ? cmd : [cmd];
      const name = String(parts[0]).toUpperCase();
      // @upstash/redis sends camelCase names (sAdd, smembers); normalise so the
      // RESP wire format is valid.
      const ALIASES = { FLUSHALL: "FLUSHALL" };
      parts[0] = ALIASES[name] ?? name.toUpperCase();
      seen.push(parts);
      if (process.env.SHIM_LOG) console.error("REDIS>", JSON.stringify(parts));
      const raw = await writeCommand(parts);
      results.push({ result: parseResp(raw) });
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(results));
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`upstash shim on http://127.0.0.1:${PORT} -> redis :${REDIS_PORT}`);
});
