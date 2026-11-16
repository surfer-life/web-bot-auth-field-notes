// Web Bot Auth (draft-ietf-webbotauth-httpsig-protocol-01) signing helpers. 2026-11-15, surfer
import crypto from "node:crypto";
export const b64url = b => Buffer.from(b).toString("base64url");
export function jwkOf(privateKey) {            // public JWK (OKP, Ed25519)
  const j = crypto.createPublicKey(privateKey).export({ format: "jwk" });
  return { kty: "OKP", crv: "Ed25519", x: j.x };
}
export function thumbprint(jwk) {              // RFC 8037 A.3: {"crv","kty","x"} in that order, SHA-256
  return b64url(crypto.createHash("sha256").update(`{"crv":"${jwk.crv}","kty":"${jwk.kty}","x":"${jwk.x}"}`).digest());
}
// Request signature: covers @authority and signature-agent;key=label
export function signRequest({ privateKey, authority, agentUrl, label = "sig1", created, expires, nonce, alg = true, extra = [], form = "dict" }) {
  // form: "dict" (draft -01), "legacy" (old sf-string form, some verifiers still use it), "bare" (@authority only)
  const keyid = thumbprint(jwkOf(privateKey));
  const saId = form === "dict" ? `"signature-agent";key="${label}"` : `"signature-agent"`;
  const comps = form === "bare" ? ['"@authority"'] : ['"@authority"', saId, ...extra.map(e => e.id)];
  let params = `(${comps.join(" ")});created=${created};keyid="${keyid}"` + (alg ? `;alg="ed25519"` : "") + `;expires=${expires}` + (nonce ? `;nonce="${nonce}"` : "") + `;tag="web-bot-auth"`;
  const base = [`"@authority": ${authority}`, ...(form === "bare" ? [] : [`${saId}: "${agentUrl}"`]), ...extra.map(e => `${e.id}: ${e.value}`), `"@signature-params": ${params}`].join("\n");
  const sig = crypto.sign(null, Buffer.from(base), privateKey).toString("base64");
  return { base, headers: { "Signature-Agent": form === "dict" ? `${label}="${agentUrl}"` : `"${agentUrl}"`, "Signature-Input": `${label}=${params}`, "Signature": `${label}=:${sig}:` } };
}
// Proof of possession for the directory response (Appendix B.1)
export function signDirectory({ privateKey, authority, body, created, expires, label = "binding" }) {
  const keyid = thumbprint(jwkOf(privateKey));
  const digest = `sha-256=:${crypto.createHash("sha256").update(body).digest("base64")}:`;
  const params = `("@authority";req "content-digest");created=${created};expires=${expires};keyid="${keyid}";tag="http-message-signatures-directory"`;
  const base = [`"@authority";req: ${authority}`, `"content-digest": ${digest}`, `"@signature-params": ${params}`].join("\n");
  const sig = crypto.sign(null, Buffer.from(base), privateKey).toString("base64");
  return { base, headers: { "Content-Digest": digest, "Signature-Input": `${label}=${params}`, "Signature": `${label}=:${sig}:` } };
}
