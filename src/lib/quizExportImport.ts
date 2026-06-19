import type { SavedQuiz, ExportedQuiz, Question } from "@/types/quiz";
import { saveQuiz } from "@/lib/quizStorage";
import { resolveQuizOptionPaletteId } from "@/lib/quizOptionPalettes";
import {
  MAX_QUESTION_OPTIONS,
  MIN_QUESTION_OPTIONS,
  MIN_QUESTION_TIME_LIMIT_MS,
  cloneQuestions,
  sanitizeQuestionTimeLimitSeconds,
  DEFAULT_LIVE_ROOM_TIME_LIMIT_MS,
} from "@/lib/questionUtils";

function resolveExportedQuestionTimeLimitMs(value: unknown): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_QUESTION_TIME_LIMIT_MS
  ) {
    return Math.floor(value);
  }
  return sanitizeQuestionTimeLimitSeconds(
    DEFAULT_LIVE_ROOM_TIME_LIMIT_MS / 1000
  );
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function exportQuiz(quiz: SavedQuiz): ExportedQuiz {
  return {
    version: 1,
    title: quiz.title,
    questions: cloneQuestions(quiz.questions),
    exportedAt: Date.now(),
    optionPaletteId: resolveQuizOptionPaletteId(quiz.optionPaletteId),
    questionTimeLimitMs: resolveExportedQuestionTimeLimitMs(
      quiz.questionTimeLimitMs
    ),
  };
}

export function exportQuizToFile(quiz: SavedQuiz): void {
  const exported = exportQuiz(quiz);
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quiz-${slugify(quiz.title)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMultipleQuizzes(quizzes: SavedQuiz[]): void {
  const exported = quizzes.map(exportQuiz);
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quizzes-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function validateQuestion(q: unknown, index: number): q is Question {
  if (!q || typeof q !== "object") {
    throw new Error(`Quiz inválido: a pergunta ${index + 1} está malformada.`);
  }
  const obj = q as Record<string, unknown>;
  if (typeof obj.text !== "string") {
    throw new Error(
      `Quiz inválido: a pergunta ${index + 1} não tem enunciado válido.`
    );
  }
  if (
    !Array.isArray(obj.options) ||
    obj.options.length < MIN_QUESTION_OPTIONS ||
    obj.options.length > MAX_QUESTION_OPTIONS
  ) {
    throw new Error(
      `Quiz inválido: a pergunta ${index + 1} deve ter entre ${MIN_QUESTION_OPTIONS} e ${MAX_QUESTION_OPTIONS} alternativas.`
    );
  }
  if (!obj.options.every((o: unknown) => typeof o === "string")) {
    throw new Error(
      `Quiz inválido: a pergunta ${index + 1} tem alternativas inválidas.`
    );
  }
  const correctIndex = obj.correctOptionIndex;
  if (
    typeof correctIndex !== "number" ||
    correctIndex < 0 ||
    correctIndex >= obj.options.length ||
    !Number.isInteger(correctIndex)
  ) {
    throw new Error(
      `Quiz inválido: índice de resposta correta inválido na pergunta ${index + 1}.`
    );
  }
  return true;
}

export function validateExportedQuiz(data: unknown): ExportedQuiz {
  if (!data || typeof data !== "object") {
    throw new Error(
      "Formato incompatível. O arquivo não contém um quiz válido."
    );
  }
  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error(
      "Formato incompatível. O arquivo não contém um quiz válido."
    );
  }
  if (typeof obj.title !== "string" || !obj.title.trim()) {
    throw new Error(
      "Formato incompatível. O arquivo não contém um quiz válido."
    );
  }
  if (!Array.isArray(obj.questions)) {
    throw new Error(
      "Formato incompatível. O arquivo não contém um quiz válido."
    );
  }
  obj.questions.forEach((q, i) => validateQuestion(q, i));
  const exported: ExportedQuiz = {
    version: 1,
    title: (obj.title as string).trim(),
    questions: cloneQuestions(obj.questions as Question[]),
    exportedAt: typeof obj.exportedAt === "number" ? obj.exportedAt : Date.now(),
  };
  if (obj.optionPaletteId !== undefined) {
    exported.optionPaletteId = resolveQuizOptionPaletteId(obj.optionPaletteId);
  }
  if (obj.questionTimeLimitMs !== undefined) {
    exported.questionTimeLimitMs = resolveExportedQuestionTimeLimitMs(
      obj.questionTimeLimitMs
    );
  }
  return exported;
}

export function exportedQuizToSavePayload(
  exported: ExportedQuiz
): Omit<SavedQuiz, "id" | "createdAt" | "updatedAt"> {
  return {
    title: exported.title,
    questions: exported.questions,
    optionPaletteId: resolveQuizOptionPaletteId(exported.optionPaletteId),
    questionTimeLimitMs: resolveExportedQuestionTimeLimitMs(
      exported.questionTimeLimitMs
    ),
  };
}

export function importQuiz(exported: ExportedQuiz): SavedQuiz {
  return saveQuiz(exportedQuizToSavePayload(exported));
}

export function importMultipleQuizzes(exported: ExportedQuiz[]): SavedQuiz[] {
  return exported.map(importQuiz);
}

export async function parseImportFile(
  file: File
): Promise<ExportedQuiz | ExportedQuiz[]> {
  const text = await file.text();
  if (!text.trim()) {
    throw new Error("Arquivo vazio.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      "Arquivo inválido. Selecione um arquivo .json exportado pelo Hootka."
    );
  }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error("Arquivo vazio.");
    }
    return parsed.map((item, i) => {
      try {
        return validateExportedQuiz(item);
      } catch (e) {
        throw new Error(
          `Item ${i + 1} do arquivo: ${e instanceof Error ? e.message : "inválido"}`
        );
      }
    });
  }
  return validateExportedQuiz(parsed);
}
