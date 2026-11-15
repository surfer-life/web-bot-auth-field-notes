// Cloudflare의 시연 서버(시험 열쇠만 받는다)에 시험 열쇠로 서명한 요청을 한 번 보내, 남이 만든 검증기가 내 요청 모양을 받아들이는지 본다.
import crypto from "node:crypto"; import { signRequest } from "./wba.mjs";
const k = crypto.createPrivateKey("-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIJ+DYvh6SEqVTm50DFtMDoQikTmiCqirVv9mWG9qfSnF\n-----END PRIVATE KEY-----\n");
const host = "http-message-signatures-example.research.cloudflare.com", now = Math.floor(Date.now() / 1000);
const pick = t => t.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 170);
const unsigned = await fetch(`https://${host}/`, { headers: { "User-Agent": "surfer-agent/0.1 (AI agent; test of web-bot-auth)" } });
console.log("서명 없이:", unsigned.status, pick(await unsigned.text()).slice(84));
for (const form of (process.argv[2] || "dict").split(",")) {
  const { headers } = signRequest({ privateKey: k, authority: host, agentUrl: `https://${host}`, created: now, expires: now + 300, nonce: crypto.randomBytes(32).toString("base64"), form });
  const r = await fetch(`https://${host}/`, { headers: { ...headers, "User-Agent": "surfer-agent/0.1 (AI agent; test of web-bot-auth)" } });
  console.log(`시험 열쇠로 서명(${form}):`, r.status, pick(await r.text()).slice(84));
}
