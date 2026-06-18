import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createEmptyQuestion } from "./questionUtils";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";
import type { SavedQuiz } from "@/types/quiz";

function installLocalStorageMock() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
    },
    configurable: true,
  });
}

installLocalStorageMock();

const require = createRequire(import.meta.url);
const { exportQuiz, validateExportedQuiz, importQuiz } = require("./quizExportImport");

const sampleQuestion = {
  ...createEmptyQuestion(),
  text: "Qual a capital do Brasil?",
  options: ["Brasília", "São Paulo", "Rio de Janeiro", "Salvador"],
  correctOptionIndex: 0,
};

const sampleQuiz: SavedQuiz = {
  id: "quiz-1",
  title: "Geografia",
  questions: [sampleQuestion],
  optionPaletteId: "copa",
  createdAt: 1,
  updatedAt: 1,
};

const exported = exportQuiz(sampleQuiz);
assert.equal(exported.optionPaletteId, "copa");
assert.equal(exported.title, "Geografia");

const imported = importQuiz(exported);
assert.equal(imported.optionPaletteId, "copa");
assert.equal(imported.title, "Geografia");

const legacyJson = {
  version: 1,
  title: "Quiz legado",
  questions: [sampleQuestion],
  exportedAt: Date.now(),
};
const legacy = validateExportedQuiz(legacyJson);
assert.equal(legacy.optionPaletteId, undefined);
const legacyImported = importQuiz(legacy);
assert.equal(legacyImported.optionPaletteId, DEFAULT_QUIZ_OPTION_PALETTE_ID);

const invalidPaletteJson = {
  version: 1,
  title: "Quiz inválido",
  questions: [sampleQuestion],
  exportedAt: Date.now(),
  optionPaletteId: "invalid-palette",
};
const normalized = validateExportedQuiz(invalidPaletteJson);
assert.equal(normalized.optionPaletteId, DEFAULT_QUIZ_OPTION_PALETTE_ID);
const invalidImported = importQuiz(normalized);
assert.equal(invalidImported.optionPaletteId, DEFAULT_QUIZ_OPTION_PALETTE_ID);

console.log("quizExportImport.test.ts: ok");
