// Check output matches the spec's test vectors in Appendix E.2.1 and E.2.3 exactly (RFC 9421 B.1.4 test key)
import crypto from "node:crypto";
import { signRequest, signDirectory, jwkOf, thumbprint } from "./wba.mjs";
const pem = "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIJ+DYvh6SEqVTm50DFtMDoQikTmiCqirVv9mWG9qfSnF\n-----END PRIVATE KEY-----\n";
const k = crypto.createPrivateKey(pem);
const jwk = jwkOf(k);
const ok = (name, got, want) => console.log(got === want ? "ok  " : "FAIL", name, got === want ? "" : `\n  got  ${got}\n  want ${want}`);
ok("public key x", jwk.x, "JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs");
ok("thumbprint (keyid)", thumbprint(jwk), "poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U");
const r = signRequest({ privateKey: k, authority: "example.com", agentUrl: "https://signature-agent.test", label: "sig2", created: 1735689600, expires: 4889289600,
  nonce: "n9p433xm+NJ3ph3upfBIGmsuwHw387YV7Q/F+6BSpGCVjYCqQw6rznNA8PVVLySrAWsv0hQtFioQb6E1YsauiA==" });
ok("E.2.1 request signature", r.headers.Signature, "sig2=:CGokAoY/FrPpyuzTe1Fb2kLTAH9Idw6qSFd1+D77r1firsMRCxeuLu5e6O+ek3zQgDMAzjiXtLVfqE00xnABCQ==:");
const body = '{"keys":[{"kty":"OKP","crv":"Ed25519","kid":"poqkLGiymh_W0uP6PZFw-dvez3QJT5SolqXBCW38r0U","x":"JrQLj5P_89iXES9-vFgrIy29clF9CC_oPPsw3c5D0bs","use":"sig"}]}';
const d = signDirectory({ privateKey: k, authority: "signature-agent.test", body, created: 1735689600, expires: 4889289600 });
ok("E.2.3 Content-Digest", d.headers["Content-Digest"], "sha-256=:CADMT2aBdV/rqQr/NIru64ERQkCobVvllA4V0fLFDu0=:");
ok("E.2.3 directory signature", d.headers.Signature, "binding=:l6P8R67tm3kujAxbHWio7ll01qrEZ0dKD/WWlGhNYEmTnFZM8Wt0VQ9zqGfvo7T/UMkBxsigzChM1Gpz7gOVBg==:");
const l = signRequest({ privateKey: k, authority: "example.com", agentUrl: "https://signature-agent.test", label: "sig2", created: 1735689600, expires: 1735693200, form: "legacy",
  nonce: "e8N7S2MFd/qrd6T2R3tdfAuuANngKI7LFtKYI/vowzk4lAZYadIX6wW25MwG7DCT9RUKAJ0qVkU0mEeLElW1qg==" });
ok("E.2.2 legacy-form signature", l.headers.Signature, "sig2=:jdq0SqOwHdyHr9+r5jw3iYZH6aNGKijYp/EstF4RQTQdi5N5YYKrD+mCT1HA1nZDsi6nJKuHxUi/5Syp3rLWBA==:");
