import type { SavedQuiz } from "@/types/quiz";

const STORAGE_KEY = "quiz_library";

function getStored(): SavedQuiz[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedQuiz[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStored(quizzes: SavedQuiz[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
}

export function getQuizzes(): SavedQuiz[] {
  return getStored().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getQuiz(id: string): SavedQuiz | null {
  return getStored().find((q) => q.id === id) ?? null;
}

export function saveQuiz(
  quiz: Omit<SavedQuiz, "id" | "createdAt" | "updatedAt">
): SavedQuiz {
  const now = Date.now();
  const saved: SavedQuiz = {
    id: crypto.randomUUID(),
    title: quiz.title,
    questions: quiz.questions,
    createdAt: now,
    updatedAt: now,
  };
  const all = getStored();
  all.push(saved);
  setStored(all);
  return saved;
}

export function updateQuiz(
  id: string,
  updates: Partial<Pick<SavedQuiz, "title" | "questions">>
): SavedQuiz {
  const all = getStored();
  const index = all.findIndex((q) => q.id === id);
  if (index === -1) throw new Error("Quiz não encontrado");

  const existing = all[index];
  const updated: SavedQuiz = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  all[index] = updated;
  setStored(all);
  return updated;
}

export function deleteQuiz(id: string): void {
  const all = getStored().filter((q) => q.id !== id);
  setStored(all);
}

export function duplicateQuiz(id: string): SavedQuiz {
  const original = getQuiz(id);
  if (!original) throw new Error("Quiz não encontrado");

  const title = `Cópia de ${original.title}`;
  return saveQuiz({
    title,
    questions: original.questions.map((q) => ({
      ...q,
      options: [...q.options],
    })),
  });
}
