import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  isShadowLoginEnabledServer,
  isValidShadowEmail,
  normalizeShadowEmail,
} = require("./shadowLogin");

const originalNodeEnv = process.env.NODE_ENV;
const originalAllow = process.env.ALLOW_SHADOW_LOGIN;

function restoreEnv() {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalAllow === undefined) {
    delete process.env.ALLOW_SHADOW_LOGIN;
  } else {
    process.env.ALLOW_SHADOW_LOGIN = originalAllow;
  }
}

process.env.NODE_ENV = "production";
delete process.env.ALLOW_SHADOW_LOGIN;
assert.equal(isShadowLoginEnabledServer(), false);

process.env.ALLOW_SHADOW_LOGIN = "true";
assert.equal(isShadowLoginEnabledServer(), true);

process.env.NODE_ENV = "development";
delete process.env.ALLOW_SHADOW_LOGIN;
assert.equal(isShadowLoginEnabledServer(), true);

restoreEnv();

assert.equal(normalizeShadowEmail("  Beatriz@Pier.Digital "), "beatriz@pier.digital");
assert.equal(isValidShadowEmail("beatriz.abreu@pier.digital"), true);
assert.equal(isValidShadowEmail("invalid"), false);

console.log("shadowLogin.test.ts: ok");
