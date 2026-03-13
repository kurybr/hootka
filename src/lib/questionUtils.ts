import type { Question } from "@/types/quiz";

export const MIN_QUESTION_OPTIONS = 2;
export const MAX_QUESTION_OPTIONS = 5;
export const DEFAULT_QUESTION_OPTIONS = 4;
export const DEFAULT_QUESTION_TIME_LIMIT_MS = 120000;
export const MAX_QUESTION_SCORE = 120;
export const QUESTION_SHORTCUT_KEYS = ["a", "s", "d", "f", "g"] as const;
export const QUESTION_OPTION_COLORS = [
  "bg-red-500 hover:bg-red-600 border-red-600",
  "bg-blue-500 hover:bg-blue-600 border-blue-600",
  "bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-yellow-950",
  "bg-green-500 hover:bg-green-600 border-green-600",
  "bg-purple-500 hover:bg-purple-600 border-purple-600",
] as const;

export function createEmptyQuestion(
  optionCount = DEFAULT_QUESTION_OPTIONS
): Question {
  const safeOptionCount = Math.min(
    MAX_QUESTION_OPTIONS,
    Math.max(MIN_QUESTION_OPTIONS, optionCount)
  );

  return {
    text: "",
    options: Array.from({ length: safeOptionCount }, () => ""),
    correctOptionIndex: 0,
  };
}

export function cloneQuestion(question: Question): Question {
  return {
    ...question,
    options: [...question.options],
  };
}

export function cloneQuestions(questions: Question[]): Question[] {
  return questions.map(cloneQuestion);
}

/** Normaliza uma pergunta vinda do Firebase (pode ter options undefined). */
export function normalizeQuestionFromFirebase(
  raw: Partial<Question> & { text?: string }
): Question {
  const options = Array.isArray(raw.options)
    ? raw.options.slice(0, MAX_QUESTION_OPTIONS)
    : [];
  const normalizedOptions =
    options.length < MIN_QUESTION_OPTIONS
      ? [
          ...options,
          ...Array.from(
            { length: MIN_QUESTION_OPTIONS - options.length },
            () => ""
          ),
        ]
      : options;
  const correctOptionIndex = Math.min(
    normalizedOptions.length - 1,
    Math.max(0, typeof raw.correctOptionIndex === "number" ? raw.correctOptionIndex : 0)
  );
  return {
    text: typeof raw.text === "string" ? raw.text : "",
    options: normalizedOptions,
    correctOptionIndex,
  };
}

export function normalizeQuestion(question: Question): Question {
  const options = Array.isArray(question.options)
    ? question.options.slice(0, MAX_QUESTION_OPTIONS)
    : [];
  const normalizedOptions =
    options.length < MIN_QUESTION_OPTIONS
      ? [
          ...options,
          ...Array.from(
            { length: MIN_QUESTION_OPTIONS - options.length },
            () => ""
          ),
        ]
      : options;

  const correctOptionIndex = Math.min(
    normalizedOptions.length - 1,
    Math.max(0, question.correctOptionIndex)
  );

  return {
    text: question.text,
    options: normalizedOptions,
    correctOptionIndex,
  };
}

export function trimQuestion(question: Question): Question {
  const normalized = normalizeQuestion(question);
  return {
    text: normalized.text.trim(),
    options: normalized.options.map((option) => option.trim()),
    correctOptionIndex: normalized.correctOptionIndex,
  };
}

export function validateQuestion(
  question: Question,
  index?: number
): string | null {
  const prefix =
    typeof index === "number" ? `Pergunta ${index + 1}: ` : "";

  if (!question.text.trim()) {
    return `${prefix}enunciado é obrigatório`;
  }

  if (
    question.options.length < MIN_QUESTION_OPTIONS ||
    question.options.length > MAX_QUESTION_OPTIONS
  ) {
    return `${prefix}cada pergunta deve ter entre ${MIN_QUESTION_OPTIONS} e ${MAX_QUESTION_OPTIONS} alternativas`;
  }

  const filled = question.options.filter((option) => option.trim()).length;
  if (filled !== question.options.length) {
    return `${prefix}preencha todas as alternativas`;
  }

  if (
    question.correctOptionIndex < 0 ||
    question.correctOptionIndex >= question.options.length
  ) {
    return `${prefix}selecione a alternativa correta`;
  }

  if (!question.options[question.correctOptionIndex]?.trim()) {
    return `${prefix}a alternativa correta não pode estar vazia`;
  }

  return null;
}

export function validateQuestions(questions: Question[]): string | null {
  for (let index = 0; index < questions.length; index += 1) {
    const error = validateQuestion(questions[index], index);
    if (error) return error;
  }

  return null;
}

export function isQuestionValid(question: Question): boolean {
  return validateQuestion(question) === null;
}

export function calculateTimedScore(
  correct: boolean,
  responseTime: number,
  timeLimitMs = DEFAULT_QUESTION_TIME_LIMIT_MS
): number {
  if (!correct) return 0;
  const remainingTime = Math.max(0, timeLimitMs - responseTime);
  return Math.round(MAX_QUESTION_SCORE * (remainingTime / timeLimitMs));
}

export function compareScores(
  scoreA: number,
  responseTimeA: number,
  scoreB: number,
  responseTimeB: number
): number {
  if (scoreB !== scoreA) return scoreB - scoreA;
  return responseTimeA - responseTimeB;
}
