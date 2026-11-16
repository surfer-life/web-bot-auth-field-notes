// Tell apart whether a difference comes from a valid signature or just from signature headers being present: bad signature, Signature-Agent only, unknown header.
import { readFileSync } from "node:fs"; import crypto from "node:crypto"; import { signRequest } from "./wba.mjs";
const UA = "surfer-agent/0.1 (AI agent; +https://surfer-frozen-check.fly.dev/agent)", u = process.argv[2];
const k = crypto.createPrivateKey(readFileSync(process.env.WBA_KEY)); const now = Math.floor(Date.now() / 1000);
const { headers } = signRequest({ privateKey: k, authority: new URL(u).host, agentUrl: "https://surfer-frozen-check.fly.dev/.well-known/http-message-signatures-directory", created: now, expires: now + 300, nonce: crypto.randomBytes(32).toString("base64") });
const i = headers.Signature.indexOf(":") + 10; const bad = { ...headers, Signature: headers.Signature.slice(0, i) + (headers.Signature[i] === "A" ? "B" : "A") + headers.Signature.slice(i + 1) };
const cases = { "unsigned": {}, "valid sig": headers, "bad sig": bad, "Signature-Agent only": { "Signature-Agent": headers["Signature-Agent"] }, "unknown header": { "X-Something": "1" } };
for (const [name, h] of Object.entries(cases)) {
  const t = await (await fetch(u, { headers: { "User-Agent": UA, Accept: "text/html,*/*", ...h } })).text();
  console.log(name.padEnd(16), "bytes", t.length, "| zaraz script", t.includes("zaraz is loaded twice") ? "present" : "absent");
}
