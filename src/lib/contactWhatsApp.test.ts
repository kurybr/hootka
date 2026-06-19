import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  readContactWhatsAppEnvConfig,
  buildWhatsAppUrl,
  buildWhatsAppPrefillMessage,
  isContactWhatsAppEnabled,
} = require("./contactWhatsApp");

const originalNumber = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER;
const originalEnabled = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED;
const originalCreator = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_CREATOR_NAME;

process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER = "";
delete process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED;
assert.equal(readContactWhatsAppEnvConfig().enabled, false);
assert.equal(isContactWhatsAppEnabled(), false);
assert.equal(buildWhatsAppUrl(), null);

process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER = "5511999999999";
delete process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED;
const config = readContactWhatsAppEnvConfig();
assert.equal(config.enabled, true);
assert.equal(config.phoneNumber, "5511999999999");
assert.equal(config.creatorName, "Jorge");

const message = buildWhatsAppPrefillMessage("Jorge");
assert.equal(
  message,
  "Olá, Jorge!\n\nEstou usando o Hootka e queria conversar sobre:"
);

const url = buildWhatsAppUrl(config);
assert.ok(url);
assert.ok(url.startsWith("https://wa.me/5511999999999?text="));
assert.ok(url.includes(encodeURIComponent("Olá, Jorge!")));

process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED = "false";
assert.equal(readContactWhatsAppEnvConfig().enabled, false);

process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED = "true";
process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER = "123";
assert.equal(readContactWhatsAppEnvConfig().enabled, false);

process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER = "+55 (11) 98888-7777";
assert.equal(readContactWhatsAppEnvConfig().phoneNumber, "5511988887777");

process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_CREATOR_NAME = "Rafael";
assert.equal(
  buildWhatsAppPrefillMessage(readContactWhatsAppEnvConfig().creatorName),
  "Olá, Rafael!\n\nEstou usando o Hootka e queria conversar sobre:"
);

if (originalNumber === undefined) {
  delete process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER;
} else {
  process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER = originalNumber;
}

if (originalEnabled === undefined) {
  delete process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED;
} else {
  process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED = originalEnabled;
}

if (originalCreator === undefined) {
  delete process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_CREATOR_NAME;
} else {
  process.env.NEXT_PUBLIC_CONTACT_WHATSAPP_CREATOR_NAME = originalCreator;
}

console.log("contactWhatsApp.test.ts: ok");
