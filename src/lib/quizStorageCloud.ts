import { ref, get, set, remove, onValue } from "firebase/database";
import type { SavedQuiz } from "@/types/quiz";
import { getFirebaseDatabase } from "@/lib/firebase";
import { getQuizzes as getLocalQuizzes } from "@/lib/quizStorage";

function quizzesRef(uid: string) {
  const db = getFirebaseDatabase();
  if (!db) throw new Error("Firebase não está disponível");
  return ref(db, `users/${uid}/quizzes`);
}

function quizRef(uid: string, quizId: string) {
  const db = getFirebaseDatabase();
  if (!db) throw new Error("Firebase não está disponível");
  return ref(db, `users/${uid}/quizzes/${quizId}`);
}

function snapshotToArray(snapshot: { val: () => unknown }): SavedQuiz[] {
  const data = snapshot.val();
  if (!data || typeof data !== "object") return [];
  return Object.values(data as Record<string, SavedQuiz>).filter(
    (q) => q && q.id
  );
}

function sortByUpdatedDesc(quizzes: SavedQuiz[]): SavedQuiz[] {
  return [...quizzes].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getQuizzesCloud(uid: string): Promise<SavedQuiz[]> {
  try {
    const snapshot = await get(quizzesRef(uid));
    return sortByUpdatedDesc(snapshotToArray(snapshot));
  } catch {
    return [];
  }
}

export async function getQuizCloud(
  uid: string,
  quizId: string
): Promise<SavedQuiz | null> {
  try {
    const snapshot = await get(quizRef(uid, quizId));
    const data = snapshot.val();
    return data && typeof data === "object" && (data as SavedQuiz).id
      ? (data as SavedQuiz)
      : null;
  } catch {
    return null;
  }
}

export async function saveQuizCloud(
  uid: string,
  quiz: Omit<SavedQuiz, "id" | "createdAt" | "updatedAt">
): Promise<SavedQuiz> {
  const now = Date.now();
  const saved: SavedQuiz = {
    id: crypto.randomUUID(),
    title: quiz.title,
    questions: quiz.questions,
    createdAt: now,
    updatedAt: now,
  };
  await set(quizRef(uid, saved.id), saved);
  return saved;
}

export async function updateQuizCloud(
  uid: string,
  quizId: string,
  updates: Partial<Pick<SavedQuiz, "title" | "questions">>
): Promise<SavedQuiz> {
  const existing = await getQuizCloud(uid, quizId);
  if (!existing) throw new Error("Quiz não encontrado");

  const updated: SavedQuiz = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await set(quizRef(uid, quizId), updated);
  return updated;
}

export async function deleteQuizCloud(
  uid: string,
  quizId: string
): Promise<void> {
  await remove(quizRef(uid, quizId));
}

export async function duplicateQuizCloud(
  uid: string,
  quizId: string
): Promise<SavedQuiz> {
  const original = await getQuizCloud(uid, quizId);
  if (!original) throw new Error("Quiz não encontrado");

  return saveQuizCloud(uid, {
    title: `Cópia de ${original.title}`,
    questions: original.questions.map((q) => ({
      ...q,
      options: [...q.options] as [string, string, string, string],
    })),
  });
}

export async function migrateLocalToCloud(uid: string): Promise<number> {
  const localQuizzes = getLocalQuizzes();
  if (localQuizzes.length === 0) return 0;

  for (const quiz of localQuizzes) {
    await set(quizRef(uid, quiz.id), quiz);
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem("quiz_library");
  }

  return localQuizzes.length;
}

export function subscribeToQuizzes(
  uid: string,
  callback: (quizzes: SavedQuiz[]) => void
): () => void {
  const db = getFirebaseDatabase();
  if (!db) {
    callback([]);
    return () => {};
  }

  const dbRef = ref(db, `users/${uid}/quizzes`);
  const unsubscribe = onValue(
    dbRef,
    (snapshot) => {
      callback(sortByUpdatedDesc(snapshotToArray(snapshot)));
    },
    () => {
      callback([]);
    }
  );

  return unsubscribe;
}
