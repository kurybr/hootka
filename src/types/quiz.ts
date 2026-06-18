export type RoomStatus = "waiting" | "playing" | "result" | "finished";
export type GlobalQuizVisibility = "official" | "community";
export type GlobalQuizStatus = "draft" | "published" | "archived";
export type GlobalQuizAttemptStatus = "in_progress" | "completed" | "abandoned";

export type QuizOptionPaletteId = "hootka" | "copa" | "lgbt" | "dia" | "lua";

export const DEFAULT_QUIZ_OPTION_PALETTE_ID: QuizOptionPaletteId = "hootka";

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  hostId: string;
  currentQuestionIndex: number;
  questionStartTimestamp: number | null;
  participants: Record<string, Participant>;
  questions: Question[];
  answers: Record<string, Record<string, Answer>>;
  questionTimeLimitMs: number;
  optionPaletteId?: QuizOptionPaletteId;
}

export interface Participant {
  id: string;
  name: string;
  totalScore: number;
  totalResponseTime: number;
  questionsAnswered: number;
  joinedAt: number;
  connected: boolean;
}

export interface Question {
  text: string;
  options: string[];
  correctOptionIndex: number;
}

/** Pergunta sem a resposta correta - para exibição ao jogador. */
export interface PublicQuestion {
  text: string;
  options: string[];
}

/** Quiz global sem respostas corretas - para exibição ao jogador. */
export interface PublicGlobalQuiz extends Omit<GlobalQuiz, "questions"> {
  questions: PublicQuestion[];
}

export interface Answer {
  participantId: string;
  optionIndex: number;
  timestamp: number;
  responseTime: number;
  score: number;
}

export interface SavedQuiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
  optionPaletteId?: QuizOptionPaletteId;
  questionTimeLimitMs?: number;
}

export interface ExportedQuiz {
  version: 1;
  title: string;
  questions: Question[];
  exportedAt: number;
  optionPaletteId?: QuizOptionPaletteId;
  questionTimeLimitMs?: number;
}

export interface CloudSavedQuiz extends SavedQuiz {
  ownerId: string;
}

export interface GlobalQuiz {
  id: string;
  slug: string;
  title: string;
  description: string;
  topic: string;
  questions: Question[];
  visibility: GlobalQuizVisibility;
  status: GlobalQuizStatus;
  attemptLimit: number | null;
  questionTimeLimitMs: number;
  optionPaletteId?: QuizOptionPaletteId;
  createdBy: string;
  createdByUsername: string;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
}

export interface GlobalQuizAttemptAnswer {
  questionIndex: number;
  optionIndex: number | null;
  timestamp: number;
  responseTime: number;
  score: number;
  correct: boolean;
}

export interface GlobalQuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  username: string;
  email: string;
  status: GlobalQuizAttemptStatus;
  currentQuestionIndex: number;
  questionStartTimestamp: number | null;
  answers: Record<string, GlobalQuizAttemptAnswer>;
  totalScore: number;
  totalResponseTime: number;
  startedAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface GlobalQuizUserStats {
  quizId: string;
  userId: string;
  username: string;
  email: string;
  attemptsUsed: number;
  extraAttemptsGranted: number;
  activeAttemptId: string | null;
  bestScore: number;
  bestResponseTime: number;
  bestAttemptId: string | null;
  lastAttemptAt: number | null;
  updatedAt: number;
}

export interface GlobalQuizLeaderboardEntry {
  quizId: string;
  userId: string;
  username: string;
  score: number;
  totalResponseTime: number;
  attemptId: string;
  completedAt: number;
}

export interface GlobalQuizAdminUserEntry extends GlobalQuizUserStats {
  attemptLimit: number | null;
  remainingAttempts: number | null;
}
