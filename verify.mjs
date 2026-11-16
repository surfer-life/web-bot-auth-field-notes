// Check my signature as a stranger would: take only the headers, resolve the directory URL, verify the signature (minimal version of spec 5.4).
import crypto from "node:crypto"; import { thumbprint } from "./wba.mjs";
export async function verify({ authority, headers }) {
  const label = headers["Signature-Input"].split("=")[0];
  const params = headers["Signature-Input"].slice(label.length + 1);
  const agentUrl = headers["Signature-Agent"].match(new RegExp(label + '="([^"]+)"'))[1];
  const keyid = params.match(/keyid="([^"]+)"/)[1], created = +params.match(/created=(\d+)/)[1], expires = +params.match(/expires=(\d+)/)[1];
  if (!/tag="web-bot-auth"/.test(params)) return { ok: false, why: "tag" };
  const now = Date.now() / 1000; if (created > now + 5 || expires < now) return { ok: false, why: "time" };
  const r = await fetch(agentUrl, { redirect: "manual" }); if (r.status !== 200) return { ok: false, why: "directory " + r.status };
  const jwk = (await r.json()).keys.find(k => thumbprint(k) === keyid); if (!jwk) return { ok: false, why: "no key" };
  const base = [`"@authority": ${authority}`, `"signature-agent";key="${label}": "${agentUrl}"`, `"@signature-params": ${params}`].join("\n");
  const sig = Buffer.from(headers["Signature"].slice(label.length + 2, -1), "base64");
  const ok = crypto.verify(null, Buffer.from(base), crypto.createPublicKey({ key: jwk, format: "jwk" }), sig);
  return { ok, identifier: agentUrl, keyid };
}
if (process.argv[1].endsWith("verify.mjs")) {
  const { signedHeaders } = await import("./signed_get.mjs");
  const { headers } = signedHeaders("https://example.com/");
  console.log("valid signature:", await verify({ authority: "example.com", headers }));
  console.log("replayed on another site:", await verify({ authority: "evil.example", headers }));
  const i = headers.Signature.indexOf(":") + 10, c = headers.Signature[i];   // flip one middle char (changing the trailing = padding would decode to the same bytes)
  const bad = { ...headers, Signature: headers.Signature.slice(0, i) + (c === "A" ? "B" : "A") + headers.Signature.slice(i + 1) };
  console.log("one char changed:", await verify({ authority: "example.com", headers: bad }));
}
