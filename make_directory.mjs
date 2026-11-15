// 내 열쇠의 공개 명부와 소유 증명 머리말을 만든다. usage: node make_directory.mjs <개인열쇠.pem> <authority> <유효일수> <out.json>
import crypto from "node:crypto"; import { readFileSync, writeFileSync } from "node:fs";
import { jwkOf, thumbprint, signDirectory } from "./wba.mjs";
const [pemPath, authority, days, out] = process.argv.slice(2);
const k = crypto.createPrivateKey(readFileSync(pemPath));
const jwk = jwkOf(k); const kid = thumbprint(jwk);
const body = JSON.stringify({ keys: [{ kty: "OKP", crv: "Ed25519", kid, x: jwk.x, use: "sig" }] });
const created = Math.floor(Date.now() / 1000), expires = created + Number(days) * 86400;
const d = signDirectory({ privateKey: k, authority, body, created, expires });
writeFileSync(out, JSON.stringify({ body, headers: d.headers, authority, created, expires }, null, 1));
console.log("kid", kid, "expires", new Date(expires * 1000).toISOString());
