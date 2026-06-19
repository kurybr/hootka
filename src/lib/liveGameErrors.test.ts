import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isBenignLiveGameError } = require("./liveGameErrors");

assert.equal(isBenignLiveGameError("STATUS_INVALIDO"), true);
assert.equal(isBenignLiveGameError("ERRO_DESCONHECIDO"), false);
assert.equal(isBenignLiveGameError("SALA_NAO_ENCONTRADA"), false);
assert.equal(isBenignLiveGameError(""), false);

console.log("liveGameErrors.test.ts: ok");
