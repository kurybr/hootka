import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createEmptyQuestion } from "./questionUtils";
import { DEFAULT_QUIZ_OPTION_PALETTE_ID } from "@/types/quiz";

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
const {
  clearQuizFormDraft,
  GLOBAL_QUIZ_CREATE_DRAFT_KEY,
  isGlobalQuizFormDraftEmpty,
  isLiveRoomFormDraftEmpty,
  LIVE_ROOM_CREATE_DRAFT_KEY,
  loadGlobalQuizFormDraft,
  loadLiveRoomFormDraft,
  saveGlobalQuizFormDraft,
  saveLiveRoomFormDraft,
} = require("./quizFormDraftStorage") as typeof import("./quizFormDraftStorage");

const questions = [
  {
    ...createEmptyQuestion(),
    text: "Qual é a capital do Brasil?",
    options: ["São Paulo", "Brasília", "Rio", "Salvador"],
    correctIndex: 1,
  },
];

saveLiveRoomFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY, {
  quizTitle: "Geografia",
  saveToLibrary: true,
  questionTimeLimitSeconds: "30",
  optionPaletteId: "copa",
  questions,
});

const liveDraft = loadLiveRoomFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY);
assert.equal(liveDraft?.quizTitle, "Geografia");
assert.equal(liveDraft?.saveToLibrary, true);
assert.equal(liveDraft?.optionPaletteId, "copa");
assert.equal(liveDraft?.questions[0]?.text, "Qual é a capital do Brasil?");
assert.equal(isLiveRoomFormDraftEmpty(liveDraft!), false);

saveGlobalQuizFormDraft(GLOBAL_QUIZ_CREATE_DRAFT_KEY, {
  title: "Quiz comunitário",
  description: "Descrição",
  topic: "Tema 1",
  visibility: "community",
  status: "draft",
  attemptLimitMode: "limited",
  attemptLimitInput: "5",
  questionTimeLimitSeconds: "60",
  optionPaletteId: DEFAULT_QUIZ_OPTION_PALETTE_ID,
  questions,
});

const globalDraft = loadGlobalQuizFormDraft(GLOBAL_QUIZ_CREATE_DRAFT_KEY);
assert.equal(globalDraft?.title, "Quiz comunitário");
assert.equal(globalDraft?.attemptLimitInput, "5");
assert.equal(isGlobalQuizFormDraftEmpty(globalDraft!), false);

saveLiveRoomFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY, {
  quizTitle: "",
  saveToLibrary: false,
  questionTimeLimitSeconds: "20",
  optionPaletteId: DEFAULT_QUIZ_OPTION_PALETTE_ID,
  questions: [createEmptyQuestion()],
});

const emptyDraft = loadLiveRoomFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY);
assert.ok(emptyDraft);
assert.equal(isLiveRoomFormDraftEmpty(emptyDraft!), true);

clearQuizFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY);
assert.equal(loadLiveRoomFormDraft(LIVE_ROOM_CREATE_DRAFT_KEY), null);

console.log("quizFormDraftStorage.test.ts: ok");
