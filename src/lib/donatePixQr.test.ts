import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildDonatePixBrCode } = require("./donatePixQr");

const sampleInput = {
  pixKey: "jorge@exemplo.com",
  merchantName: "Hootka",
  merchantCity: "Sao Paulo",
};

const brCode = buildDonatePixBrCode(sampleInput);
assert.ok(brCode.includes("jorge@exemplo.com"));
assert.ok(brCode.startsWith("000201"));

console.log("donatePixQr.test.ts: ok");
