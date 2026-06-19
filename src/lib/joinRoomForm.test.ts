import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  normalizeRoomCode,
  formatRoomCodeDisplay,
  validateRoomCode,
  validatePlayerName,
} = require("./joinRoomForm");

assert.equal(normalizeRoomCode("ab 12 3"), "AB123");
assert.equal(formatRoomCodeDisplay("abc123"), "A B C 1 2 3");
assert.equal(validateRoomCode(""), "Informe o código da sala");
assert.equal(validateRoomCode("ABC"), "O código deve ter exatamente 6 caracteres");
assert.equal(validateRoomCode("ABC123"), null);
assert.equal(validatePlayerName("J"), "O nome deve ter pelo menos 2 caracteres");
assert.equal(validatePlayerName("João"), null);

console.log("joinRoomForm.test.ts: ok");
