import type {
  GlobalQuiz,
  GlobalQuizAttempt,
  GlobalQuizLeaderboardEntry,
  GlobalQuizUserStats,
  Question,
} from "@/types/quiz";
import {
  DEFAULT_QUESTION_TIME_LIMIT_MS,
  cloneQuestions,
  trimQuestion,
  validateQuestions,
} from "@/lib/questionUtils";

export function slugifyQuizTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function sanitizeGlobalQuizInput(input: {
  title: string;
  description?: string;
  topic?: string;
  attemptLimit?: number | null;
  questionTimeLimitMs?: number | null;
  questions: Question[];
}): {
  title: string;
  description: string;
  topic: string;
  attemptLimit: number | null;
  questionTimeLimitMs: number;
  questions: Question[];
} {
  const title = input.title.trim();
  const description = input.description?.trim() ?? "";
  const topic = input.topic?.trim() ?? "";
  const attemptLimit =
    typeof input.attemptLimit === "number" && input.attemptLimit > 0
      ? Math.floor(input.attemptLimit)
      : null;
  const questionTimeLimitMs =
    typeof input.questionTimeLimitMs === "number" && input.questionTimeLimitMs > 0
      ? Math.floor(input.questionTimeLimitMs)
      : DEFAULT_QUESTION_TIME_LIMIT_MS;
  const questions = cloneQuestions(input.questions).map(trimQuestion);

  if (!title) {
    throw new Error("Título do quiz é obrigatório");
  }

  if (questions.length === 0) {
    throw new Error("Adicione pelo menos uma pergunta ao quiz");
  }

  const validationError = validateQuestions(questions);
  if (validationError) {
    throw new Error(validationError);
  }

  return {
    title,
    description,
    topic,
    attemptLimit,
    questionTimeLimitMs,
    questions,
  };
}

export function createInitialGlobalQuizUserStats(
  quiz: GlobalQuiz,
  user: {
    uid: string;
    email: string | null;
    username: string | null;
  }
): GlobalQuizUserStats {
  return {
    quizId: quiz.id,
    userId: user.uid,
    username: user.username ?? "Usuário",
    email: user.email ?? "",
    attemptsUsed: 0,
    extraAttemptsGranted: 0,
    activeAttemptId: null,
    bestScore: 0,
    bestResponseTime: Number.MAX_SAFE_INTEGER,
    bestAttemptId: null,
    lastAttemptAt: null,
    updatedAt: Date.now(),
  };
}

export function getEffectiveAttemptLimit(
  quiz: GlobalQuiz,
  stats: GlobalQuizUserStats | null
): number | null {
  if (quiz.attemptLimit === null) return null;
  return quiz.attemptLimit + (stats?.extraAttemptsGranted ?? 0);
}

export function getRemainingAttempts(
  quiz: GlobalQuiz,
  stats: GlobalQuizUserStats | null
): number | null {
  const limit = getEffectiveAttemptLimit(quiz, stats);
  if (limit === null) return null;
  return Math.max(0, limit - (stats?.attemptsUsed ?? 0));
}

export function shouldReplaceLeaderboardEntry(
  current: GlobalQuizLeaderboardEntry | null,
  attempt: GlobalQuizAttempt
): boolean {
  if (!current) return true;
  if (attempt.totalScore !== current.score) {
    return attempt.totalScore > current.score;
  }
  if (attempt.totalResponseTime !== current.totalResponseTime) {
    return attempt.totalResponseTime < current.totalResponseTime;
  }
  return (attempt.completedAt ?? Number.MAX_SAFE_INTEGER) < current.completedAt;
}
