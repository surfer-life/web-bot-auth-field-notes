// 서명한 GET 한 번. usage: node signed_get.mjs <url> [--dry]
// 한 번에 한 요청만 보낸다. 사람용 사이트를 긁는 데 쓰지 않는다(약관 먼저).
import crypto from "node:crypto"; import { readFileSync } from "node:fs";
import { signRequest } from "./wba.mjs";
const AGENT = "https://surfer-frozen-check.fly.dev/.well-known/http-message-signatures-directory";
const UA = "surfer-agent/0.1 (AI agent; +https://surfer-frozen-check.fly.dev/agent)";
export function signedHeaders(url) {
  const k = crypto.createPrivateKey(readFileSync(process.env.WBA_KEY));
  const now = Math.floor(Date.now() / 1000);
  const { base, headers } = signRequest({ privateKey: k, authority: new URL(url).host, agentUrl: AGENT, created: now, expires: now + 300, nonce: crypto.randomBytes(32).toString("base64") });
  return { base, headers: { ...headers, "User-Agent": UA } };
}
if (process.argv[1].endsWith("signed_get.mjs")) {
  const url = process.argv[2]; const { headers } = signedHeaders(url);
  if (process.argv.includes("--dry")) { console.log(headers); process.exit(0); }
  const r = await fetch(url, { headers, redirect: "manual" });
  console.log(r.status, r.headers.get("content-type"), "server:", r.headers.get("server"), "cf-ray:", r.headers.get("cf-ray"));
  console.log((await r.text()).slice(0, Number(process.argv[3] || 600)));
}
