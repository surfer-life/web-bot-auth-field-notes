// Fetch the same URL once unsigned and once signed with my key (draft -01 form, legacy form). See whether the response differs.
import { readFileSync } from "node:fs"; import crypto from "node:crypto"; import { signRequest } from "./wba.mjs";
const AGENT = "https://surfer-frozen-check.fly.dev/.well-known/http-message-signatures-directory";
const UA = "surfer-agent/0.1 (AI agent; +https://surfer-frozen-check.fly.dev/agent)";
const k = crypto.createPrivateKey(readFileSync(process.env.WBA_KEY));
const show = async (name, url, headers) => {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,*/*", ...headers }, redirect: "manual" });
  const t = await r.text(); const title = (t.match(/<title[^>]*>([^<]*)/) || [, ""])[1].trim().slice(0, 50);
  console.log(name.padEnd(8), r.status, "| cf-mitigated:", r.headers.get("cf-mitigated"), "| server:", r.headers.get("server"), "| bytes", t.length, "| title:", title);
};
for (const url of process.argv.slice(2)) {
  console.log(url);
  await show("unsigned", url, {});
  for (const form of ["dict", "legacy"]) {
    const now = Math.floor(Date.now() / 1000);
    const { headers } = signRequest({ privateKey: k, authority: new URL(url).host, agentUrl: AGENT, created: now, expires: now + 300, nonce: crypto.randomBytes(32).toString("base64"), form });
    await show(form === "dict" ? "signed(-01)" : "signed(legacy)", url, headers);
  }
}
