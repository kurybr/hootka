import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  recordDonatePromptShown,
  resetDonatePromptStorageForTests,
  shouldShowDonatePrompt,
} = require("./donatePromptStorage");

const storage = new Map<string, string>();

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    },
    clear: () => storage.clear(),
  },
  configurable: true,
});

resetDonatePromptStorageForTests();

assert.equal(shouldShowDonatePrompt("csv_export", { isHostContext: false }), false);
assert.equal(shouldShowDonatePrompt("csv_export", { isHostContext: true }), true);

recordDonatePromptShown("csv_export", "dismiss", Date.now());
assert.equal(
  shouldShowDonatePrompt("csv_export", { isHostContext: true, now: Date.now() }),
  false
);

resetDonatePromptStorageForTests();
assert.equal(shouldShowDonatePrompt("library_import"), true);
recordDonatePromptShown("library_import", "opened");
assert.equal(shouldShowDonatePrompt("library_import"), false);

resetDonatePromptStorageForTests();
recordDonatePromptShown("csv_export", "dismiss", Date.now());
assert.equal(
  shouldShowDonatePrompt("csv_export", { alwaysShow: true }),
  true
);

resetDonatePromptStorageForTests();
assert.equal(shouldShowDonatePrompt("quiz_ai_generate", { isHostContext: true }), true);
recordDonatePromptShown("quiz_ai_generate", "dismiss", Date.now());
assert.equal(
  shouldShowDonatePrompt("quiz_ai_generate", { isHostContext: true, now: Date.now() }),
  false
);

console.log("donatePromptStorage.test.ts: ok");
