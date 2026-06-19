import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { readDonateEnvConfig } = require("./donateConfig");

const originalPixKey = process.env.NEXT_PUBLIC_DONATE_PIX_KEY;
const originalEnabled = process.env.NEXT_PUBLIC_DONATE_ENABLED;

process.env.NEXT_PUBLIC_DONATE_PIX_KEY = "";
process.env.NEXT_PUBLIC_DONATE_ENABLED = "true";
assert.equal(readDonateEnvConfig().enabled, false);

process.env.NEXT_PUBLIC_DONATE_PIX_KEY = "jorge@exemplo.com";
delete process.env.NEXT_PUBLIC_DONATE_ENABLED;
assert.equal(readDonateEnvConfig().enabled, true);
assert.equal(readDonateEnvConfig().pixKey, "jorge@exemplo.com");

if (originalPixKey === undefined) {
  delete process.env.NEXT_PUBLIC_DONATE_PIX_KEY;
} else {
  process.env.NEXT_PUBLIC_DONATE_PIX_KEY = originalPixKey;
}

if (originalEnabled === undefined) {
  delete process.env.NEXT_PUBLIC_DONATE_ENABLED;
} else {
  process.env.NEXT_PUBLIC_DONATE_ENABLED = originalEnabled;
}

console.log("donateConfig.test.ts: ok");
