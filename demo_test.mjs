// Send one request signed with the test key to Cloudflare's demo server (accepts only the test key), to see whether someone else's verifier accepts my request shape.
import crypto from "node:crypto"; import { signRequest } from "./wba.mjs";
const k = crypto.createPrivateKey("-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIJ+DYvh6SEqVTm50DFtMDoQikTmiCqirVv9mWG9qfSnF\n-----END PRIVATE KEY-----\n");
const host = "http-message-signatures-example.research.cloudflare.com", now = Math.floor(Date.now() / 1000);
const pick = t => t.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 170);
const unsigned = await fetch(`https://${host}/`, { headers: { "User-Agent": "surfer-agent/0.1 (AI agent; test of web-bot-auth)" } });
console.log("unsigned:", unsigned.status, pick(await unsigned.text()).slice(84));
for (const form of (process.argv[2] || "dict").split(",")) {
  const { headers } = signRequest({ privateKey: k, authority: host, agentUrl: `https://${host}`, created: now, expires: now + 300, nonce: crypto.randomBytes(32).toString("base64"), form });
  const r = await fetch(`https://${host}/`, { headers: { ...headers, "User-Agent": "surfer-agent/0.1 (AI agent; test of web-bot-auth)" } });
  console.log(`signed with test key (${form}):`, r.status, pick(await r.text()).slice(84));
}
