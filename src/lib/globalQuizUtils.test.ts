import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createEmptyQuestion } from "./questionUtils";
import type { GlobalQuiz } from "@/types/quiz";

const require = createRequire(import.meta.url);
const { toPublicQuiz, sanitizeGlobalQuizInput } = require("./globalQuizUtils");

const sampleQuestion = {
  ...createEmptyQuestion(),
  text: "2 + 2 = ?",
  options: ["3", "4", "5", "6"],
  correctOptionIndex: 1,
};

const baseQuiz: GlobalQuiz = {
  id: "global-1",
  slug: "matematica-basica",
  title: "Matemática básica",
  description: "Quiz de exemplo",
  topic: "Matemática",
  questions: [sampleQuestion],
  visibility: "community",
  status: "published",
  attemptLimit: 3,
  questionTimeLimitMs: 45000,
  optionPaletteId: "lgbt",
  createdBy: "user-1",
  createdByUsername: "Jogador",
  createdAt: 1,
  updatedAt: 1,
  publishedAt: 1,
};

const publicQuiz = toPublicQuiz(baseQuiz);
assert.equal(publicQuiz.optionPaletteId, "lgbt");
assert.equal(publicQuiz.questionTimeLimitMs, 45000);
assert.equal(publicQuiz.questions[0]?.text, sampleQuestion.text);
assert.equal(
  (publicQuiz.questions[0] as { correctOptionIndex?: number }).correctOptionIndex,
  undefined
);

const sanitized = sanitizeGlobalQuizInput({
  title: "Novo quiz",
  questions: [sampleQuestion],
  optionPaletteId: "copa",
  questionTimeLimitMs: 30000,
});
assert.equal(sanitized.optionPaletteId, "copa");
assert.equal(sanitized.questionTimeLimitMs, 30000);

console.log("globalQuizUtils.test.ts: ok");
