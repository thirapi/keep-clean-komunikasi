/**
 * Proves the FCM service account actually authenticates, without a device.
 *
 * A dummy token is deliberately used: the request is expected to be *rejected*
 * with UNREGISTERED. That rejection is the proof — it can only happen after a
 * valid OAuth2 token was obtained and FCM parsed the project. A 401/403 means
 * the credentials are wrong; a successful send would mean the dummy token is
 * somehow real.
 *
 * Usage: npx tsx --env-file=.env scripts/verify-fcm-credentials.mts
 */
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const Module = require_("node:module");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request: string, ...rest: any[]) {
  if (request === "server-only") return require_.resolve("../test/server-only-stub.ts");
  return origResolve.call(this, request, ...rest);
};

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let failures = 0;
function t(label: string, cond: boolean, detail = "") {
  if (cond) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  t("FIREBASE_PROJECT_ID set", Boolean(projectId), projectId ?? "missing");
  t("FIREBASE_CLIENT_EMAIL set", Boolean(clientEmail), clientEmail ?? "missing");
  t(
    "FIREBASE_SERVICE_ACCOUNT_JSON set",
    Boolean(rawJson),
    rawJson ? "present" : "missing",
  );

  if (!projectId || !clientEmail || !rawJson) process.exit(1);

  let credentials: Record<string, string>;
  try {
    credentials = JSON.parse(rawJson);
  } catch (e) {
    t("service account JSON parses", false, String(e));
    process.exit(1);
  }
  t("service account JSON parses", true);
  t("has private_key", Boolean(credentials.private_key));
  t(
    "client_email matches FIREBASE_CLIENT_EMAIL",
    credentials.client_email === clientEmail,
    `${credentials.client_email} vs ${clientEmail}`,
  );

  // 1. Obtain an access token. This alone proves the key pair is valid.
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: credentials as never,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });

  let accessToken = "";
  try {
    const client = await auth.getClient();
    const tok = await client.getAccessToken();
    accessToken = typeof tok === "string" ? tok : (tok?.token ?? "");
  } catch (e) {
    t("obtains an OAuth2 access token", false, String(e));
    process.exit(1);
  }
  t("obtains an OAuth2 access token", Boolean(accessToken));
  if (accessToken) {
    console.log(`      token length: ${accessToken.length}, prefix: ${accessToken.slice(0, 12)}…`);
  }

  // 2. Send to a syntactically valid but non-existent token.
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: "dummy-token-for-credential-validation-000000000000",
          notification: { title: "check", body: "check" },
        },
      }),
    },
  );

  const body = await res.text();
  console.log(`      FCM responded: ${res.status}`);
  console.log(`      body: ${body.slice(0, 220)}`);

  t(
    "auth accepted (not 401/403)",
    res.status !== 401 && res.status !== 403,
    `got ${res.status}`,
  );
  t(
    "rejected the dummy token as expected (UNREGISTERED / INVALID_ARGUMENT)",
    body.includes("UNREGISTERED") || body.includes("INVALID_ARGUMENT") || res.status === 404,
    `status ${res.status}`,
  );

  console.log("");
  console.log(
    failures === 0
      ? "CREDENTIALS VALID — FCM is wired correctly and will deliver to a real device"
      : `${failures} CHECK(S) FAILED`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
