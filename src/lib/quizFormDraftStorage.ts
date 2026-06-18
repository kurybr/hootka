import { cloneQuestions, isQuestionValid } from "@/lib/questionUtils";
import { resolveQuizOptionPaletteId } from "@/lib/quizOptionPalettes";
import type { GlobalQuiz, Question, QuizOptionPaletteId } from "@/types/quiz";

const DRAFT_VERSION = 1 as const;

export const LIVE_ROOM_CREATE_DRAFT_KEY = "hootka:draft:live-room-create";
export const GLOBAL_QUIZ_CREATE_DRAFT_KEY = "hootka:draft:global-quiz-create";

export interface LiveRoomFormDraft {
  version: typeof DRAFT_VERSION;
  savedAt: number;
  quizTitle: string;
  saveToLibrary: boolean;
  questionTimeLimitSeconds: string;
  optionPaletteId: QuizOptionPaletteId;
  questions: Question[];
}

export interface GlobalQuizFormDraft {
  version: typeof DRAFT_VERSION;
  savedAt: number;
  title: string;
  description: string;
  topic: string;
  visibility: GlobalQuiz["visibility"];
  status: GlobalQuiz["status"];
  attemptLimitMode: "limited" | "unlimited";
  attemptLimitInput: string;
  questionTimeLimitSeconds: string;
  optionPaletteId: QuizOptionPaletteId;
  questions: Question[];
}

function getLocalStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  return globalThis.localStorage;
}

function readDraft<T>(key: string): T | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T & { version?: number };
    if (parsed?.version !== DRAFT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeDraft<T extends { version: number }>(key: string, draft: T): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(draft));
  } catch {
    // Quota exceeded or private mode — ignore silently.
  }
}

export function clearQuizFormDraft(key: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.removeItem(key);
}

export function loadLiveRoomFormDraft(key: string): LiveRoomFormDraft | null {
  const draft = readDraft<LiveRoomFormDraft>(key);
  if (!draft || !Array.isArray(draft.questions)) return null;
  return {
    ...draft,
    optionPaletteId: resolveQuizOptionPaletteId(draft.optionPaletteId),
    questions: cloneQuestions(draft.questions),
  };
}

export function saveLiveRoomFormDraft(
  key: string,
  draft: Omit<LiveRoomFormDraft, "version" | "savedAt">
): void {
  writeDraft(key, {
    version: DRAFT_VERSION,
    savedAt: Date.now(),
    ...draft,
    optionPaletteId: resolveQuizOptionPaletteId(draft.optionPaletteId),
    questions: cloneQuestions(draft.questions),
  });
}

export function isLiveRoomFormDraftEmpty(draft: LiveRoomFormDraft): boolean {
  if (draft.quizTitle.trim() || draft.saveToLibrary) return false;
  return draft.questions.every((question) => !isQuestionValid(question));
}

export function loadGlobalQuizFormDraft(key: string): GlobalQuizFormDraft | null {
  const draft = readDraft<GlobalQuizFormDraft>(key);
  if (!draft || !Array.isArray(draft.questions)) return null;
  return {
    ...draft,
    optionPaletteId: resolveQuizOptionPaletteId(draft.optionPaletteId),
    questions: cloneQuestions(draft.questions),
  };
}

export function saveGlobalQuizFormDraft(
  key: string,
  draft: Omit<GlobalQuizFormDraft, "version" | "savedAt">
): void {
  writeDraft(key, {
    version: DRAFT_VERSION,
    savedAt: Date.now(),
    ...draft,
    optionPaletteId: resolveQuizOptionPaletteId(draft.optionPaletteId),
    questions: cloneQuestions(draft.questions),
  });
}

export function isGlobalQuizFormDraftEmpty(draft: GlobalQuizFormDraft): boolean {
  if (draft.title.trim() || draft.description.trim() || draft.topic.trim()) {
    return false;
  }
  return draft.questions.every((question) => !isQuestionValid(question));
}
