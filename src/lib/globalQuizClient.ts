import { authFetch } from "@/lib/authFetch";
import type {
  GlobalQuiz,
  GlobalQuizAdminUserEntry,
  GlobalQuizAttempt,
  GlobalQuizAttemptAnswer,
  GlobalQuizLeaderboardEntry,
  PublicGlobalQuiz,
  Question,
} from "@/types/quiz";

interface UpsertGlobalQuizInput {
  title: string;
  description?: string;
  topic?: string;
  visibility?: GlobalQuiz["visibility"];
  status?: GlobalQuiz["status"];
  attemptLimit?: number | null;
  questionTimeLimitMs?: number | null;
  questions: Question[];
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Erro ao processar a requisição");
  }
  return data as T;
}

export async function listPublishedGlobalQuizzes() {
  const response = await fetch("/api/global-quizzes");
  return parseJson<{ quizzes: PublicGlobalQuiz[] }>(response);
}

export async function listMyGlobalQuizzes() {
  const response = await authFetch("/api/global-quizzes?mine=1");
  return parseJson<{ quizzes: PublicGlobalQuiz[] }>(response);
}

export async function getPublicGlobalQuizBySlug(slug: string) {
  const response = await fetch(`/api/global-quizzes/slug/${slug}`);
  return parseJson<{
    quiz: PublicGlobalQuiz;
    leaderboard: GlobalQuizLeaderboardEntry[];
  }>(response);
}

export async function getGlobalQuizById(quizId: string) {
  const response = await authFetch(`/api/global-quizzes/id/${quizId}`);
  return parseJson<{ quiz: GlobalQuiz }>(response);
}

export async function createGlobalQuiz(input: UpsertGlobalQuizInput) {
  const response = await authFetch("/api/global-quizzes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return parseJson<{ quiz: GlobalQuiz }>(response);
}

export async function updateGlobalQuiz(
  quizId: string,
  input: UpsertGlobalQuizInput
) {
  const response = await authFetch(`/api/global-quizzes/id/${quizId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return parseJson<{ quiz: GlobalQuiz }>(response);
}

export async function startGlobalQuizAttempt(quizId: string) {
  const response = await authFetch(`/api/global-quizzes/${quizId}/attempts/start`, {
    method: "POST",
  });
  return parseJson<{
    quiz: PublicGlobalQuiz;
    attempt: GlobalQuizAttempt;
    remainingAttempts: number | null;
  }>(response);
}

export async function submitGlobalQuizAnswer(
  quizId: string,
  optionIndex: number | null
) {
  const response = await authFetch(`/api/global-quizzes/${quizId}/attempts/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ optionIndex }),
  });
  return parseJson<{
    quiz: PublicGlobalQuiz;
    attempt: GlobalQuizAttempt;
    answer: GlobalQuizAttemptAnswer;
    correctOptionIndex: number;
    completed: boolean;
    leaderboard: GlobalQuizLeaderboardEntry[];
  }>(response);
}

export async function finishGlobalQuizAttempt(quizId: string) {
  const response = await authFetch(`/api/global-quizzes/${quizId}/attempts/finish`, {
    method: "POST",
  });
  return parseJson<{ attempt: GlobalQuizAttempt }>(response);
}

export async function getGlobalQuizAdminDetails(quizId: string) {
  const response = await authFetch(`/api/global-quizzes/${quizId}/admin/details`);
  return parseJson<{
    quiz: GlobalQuiz;
    leaderboard: GlobalQuizLeaderboardEntry[];
    userStats: GlobalQuizAdminUserEntry[];
  }>(response);
}

export async function grantGlobalQuizExtraAttempts(
  quizId: string,
  targetUserId: string,
  extraAttempts: number
) {
  const response = await authFetch(`/api/global-quizzes/${quizId}/admin/attempts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ targetUserId, extraAttempts }),
  });
  return parseJson<{ entry: GlobalQuizAdminUserEntry }>(response);
}
