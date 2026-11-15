// 달라지는 까닭이 '서명이 맞아서'인지 '서명 머리말이 있어서'인지 가른다: 틀린 서명, 서명 없이 Signature-Agent 만, 모르는 머리말.
import { readFileSync } from "node:fs"; import crypto from "node:crypto"; import { signRequest } from "./wba.mjs";
const UA = "surfer-agent/0.1 (AI agent; +https://surfer-frozen-check.fly.dev/agent)", u = process.argv[2];
const k = crypto.createPrivateKey(readFileSync(process.env.WBA_KEY)); const now = Math.floor(Date.now() / 1000);
const { headers } = signRequest({ privateKey: k, authority: new URL(u).host, agentUrl: "https://surfer-frozen-check.fly.dev/.well-known/http-message-signatures-directory", created: now, expires: now + 300, nonce: crypto.randomBytes(32).toString("base64") });
const i = headers.Signature.indexOf(":") + 10; const bad = { ...headers, Signature: headers.Signature.slice(0, i) + (headers.Signature[i] === "A" ? "B" : "A") + headers.Signature.slice(i + 1) };
const cases = { "서명 없음": {}, "맞는 서명": headers, "틀린 서명": bad, "Signature-Agent만": { "Signature-Agent": headers["Signature-Agent"] }, "모르는 머리말": { "X-Something": "1" } };
for (const [name, h] of Object.entries(cases)) {
  const t = await (await fetch(u, { headers: { "User-Agent": UA, Accept: "text/html,*/*", ...h } })).text();
  console.log(name.padEnd(16), "bytes", t.length, "| zaraz 스크립트", t.includes("zaraz is loaded twice") ? "있음" : "없음");
}
