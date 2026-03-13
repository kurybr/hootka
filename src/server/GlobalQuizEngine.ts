import {
  GLOBAL_QUIZ_ATTEMPTS_PATH,
  GLOBAL_QUIZ_LEADERBOARD_PATH,
  GLOBAL_QUIZ_SLUGS_PATH,
  GLOBAL_QUIZ_USER_STATS_PATH,
  GLOBAL_QUIZZES_PATH,
  getFirebaseAdminDatabase,
} from "@/lib/firebaseAdmin";
import {
  createInitialGlobalQuizUserStats,
  getRemainingAttempts,
  sanitizeGlobalQuizInput,
  shouldReplaceLeaderboardEntry,
  slugifyQuizTitle,
} from "@/lib/globalQuizUtils";
import {
  calculateTimedScore,
  normalizeQuestionFromFirebase,
} from "@/lib/questionUtils";
import type {
  GlobalQuiz,
  GlobalQuizAdminUserEntry,
  GlobalQuizAttempt,
  GlobalQuizAttemptAnswer,
  GlobalQuizLeaderboardEntry,
  GlobalQuizUserStats,
  GlobalQuizVisibility,
  Question,
} from "@/types/quiz";

interface EngineUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  username: string | null;
  role: "user" | "admin";
}

interface UpsertGlobalQuizInput {
  title: string;
  description?: string;
  topic?: string;
  visibility?: GlobalQuizVisibility;
  status?: GlobalQuiz["status"];
  attemptLimit?: number | null;
  questionTimeLimitMs?: number | null;
  questions: Question[];
}

export class GlobalQuizEngine {
  private getDb() {
    const db = getFirebaseAdminDatabase();
    if (!db) {
      throw new Error("Firebase Admin não configurado");
    }
    return db;
  }

  private async buildUniqueSlug(title: string): Promise<string> {
    const db = this.getDb();
    const baseSlug = slugifyQuizTitle(title) || "quiz-global";
    let slug = baseSlug;
    let attempt = 2;

    while (true) {
      const snapshot = await db.ref(`${GLOBAL_QUIZ_SLUGS_PATH}/${slug}`).get();
      if (!snapshot.exists()) return slug;
      slug = `${baseSlug}-${attempt}`;
      attempt += 1;
    }
  }

  private async getUserStats(
    quizId: string,
    uid: string
  ): Promise<GlobalQuizUserStats | null> {
    const db = this.getDb();
    const snapshot = await db.ref(`${GLOBAL_QUIZ_USER_STATS_PATH}/${quizId}/${uid}`).get();
    return snapshot.exists() ? (snapshot.val() as GlobalQuizUserStats) : null;
  }

  private async getAttempt(quizId: string, attemptId: string) {
    const db = this.getDb();
    const snapshot = await db
      .ref(`${GLOBAL_QUIZ_ATTEMPTS_PATH}/${quizId}/${attemptId}`)
      .get();
    return snapshot.exists() ? (snapshot.val() as GlobalQuizAttempt) : null;
  }

  private async getLeaderboardEntry(
    quizId: string,
    uid: string
  ): Promise<GlobalQuizLeaderboardEntry | null> {
    const db = this.getDb();
    const snapshot = await db
      .ref(`${GLOBAL_QUIZ_LEADERBOARD_PATH}/${quizId}/${uid}`)
      .get();
    return snapshot.exists() ? (snapshot.val() as GlobalQuizLeaderboardEntry) : null;
  }

  async listPublishedQuizzes(): Promise<GlobalQuiz[]> {
    const db = this.getDb();
    const snapshot = await db.ref(GLOBAL_QUIZZES_PATH).get();
    const quizzes = snapshot.val() as Record<string, GlobalQuiz> | null;
    if (!quizzes) return [];

    return Object.values(quizzes)
      .filter((quiz) => quiz.status === "published")
      .sort((a, b) => {
        if (a.visibility !== b.visibility) {
          return a.visibility === "official" ? -1 : 1;
        }
        return (b.publishedAt ?? b.updatedAt) - (a.publishedAt ?? a.updatedAt);
      });
  }

  async listQuizzesByOwner(uid: string): Promise<GlobalQuiz[]> {
    const db = this.getDb();
    const snapshot = await db.ref(GLOBAL_QUIZZES_PATH).get();
    const quizzes = snapshot.val() as Record<string, GlobalQuiz> | null;
    if (!quizzes) return [];

    return Object.values(quizzes)
      .filter((quiz) => quiz.createdBy === uid)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getQuizById(quizId: string): Promise<GlobalQuiz | null> {
    const db = this.getDb();
    const snapshot = await db.ref(`${GLOBAL_QUIZZES_PATH}/${quizId}`).get();
    if (!snapshot.exists()) return null;
    const raw = snapshot.val() as GlobalQuiz;
    const questions = Array.isArray(raw.questions)
      ? raw.questions.map((q) => normalizeQuestionFromFirebase(q))
      : [];
    return { ...raw, questions };
  }

  async getQuizBySlug(slug: string): Promise<GlobalQuiz | null> {
    const db = this.getDb();
    const slugSnapshot = await db.ref(`${GLOBAL_QUIZ_SLUGS_PATH}/${slug}`).get();
    const quizId = slugSnapshot.val() as string | null;
    if (!quizId) return null;
    return this.getQuizById(quizId);
  }

  async getLeaderboard(quizId: string): Promise<GlobalQuizLeaderboardEntry[]> {
    const db = this.getDb();
    const snapshot = await db.ref(`${GLOBAL_QUIZ_LEADERBOARD_PATH}/${quizId}`).get();
    const entries = snapshot.val() as Record<string, GlobalQuizLeaderboardEntry> | null;
    if (!entries) return [];

    return Object.values(entries).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.totalResponseTime !== b.totalResponseTime) {
        return a.totalResponseTime - b.totalResponseTime;
      }
      return a.completedAt - b.completedAt;
    });
  }

  async createQuiz(user: EngineUser, input: UpsertGlobalQuizInput): Promise<GlobalQuiz> {
    const db = this.getDb();
    const now = Date.now();
    const sanitized = sanitizeGlobalQuizInput(input);
    const visibility =
      input.visibility === "official" && user.role === "admin"
        ? "official"
        : "community";
    const status =
      input.status === "published" || input.status === "archived"
        ? input.status
        : "draft";
    const quizId = crypto.randomUUID();
    const slug = await this.buildUniqueSlug(sanitized.title);
    const quiz: GlobalQuiz = {
      id: quizId,
      slug,
      title: sanitized.title,
      description: sanitized.description,
      topic: sanitized.topic,
      questions: sanitized.questions,
      visibility,
      status,
      attemptLimit: sanitized.attemptLimit,
      questionTimeLimitMs: sanitized.questionTimeLimitMs,
      createdBy: user.uid,
      createdByUsername: user.username ?? "Usuário",
      createdAt: now,
      updatedAt: now,
      publishedAt: status === "published" ? now : null,
    };

    await db.ref(`${GLOBAL_QUIZZES_PATH}/${quizId}`).set(quiz);
    await db.ref(`${GLOBAL_QUIZ_SLUGS_PATH}/${slug}`).set(quizId);

    return quiz;
  }

  async updateQuiz(
    quizId: string,
    user: EngineUser,
    input: UpsertGlobalQuizInput
  ): Promise<GlobalQuiz> {
    const db = this.getDb();
    const existing = await this.getQuizById(quizId);
    if (!existing) throw new Error("QUIZ_NOT_FOUND");
    if (existing.createdBy !== user.uid && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }

    const sanitized = sanitizeGlobalQuizInput(input);
    const visibility =
      input.visibility === "official" && user.role === "admin"
        ? "official"
        : existing.visibility;
    const status =
      input.status === "published" || input.status === "archived" || input.status === "draft"
        ? input.status
        : existing.status;
    const now = Date.now();

    const updated: GlobalQuiz = {
      ...existing,
      title: sanitized.title,
      description: sanitized.description,
      topic: sanitized.topic,
      questions: sanitized.questions,
      attemptLimit: sanitized.attemptLimit,
      questionTimeLimitMs: sanitized.questionTimeLimitMs,
      visibility,
      status,
      updatedAt: now,
      publishedAt:
        status === "published" ? existing.publishedAt ?? now : existing.publishedAt,
    };

    await db.ref(`${GLOBAL_QUIZZES_PATH}/${quizId}`).set(updated);
    return updated;
  }

  async getPublicQuizBySlug(slug: string): Promise<{
    quiz: GlobalQuiz;
    leaderboard: GlobalQuizLeaderboardEntry[];
  }> {
    const quiz = await this.getQuizBySlug(slug);
    if (!quiz || quiz.status !== "published") {
      throw new Error("QUIZ_NOT_FOUND");
    }

    const leaderboard = await this.getLeaderboard(quiz.id);
    return { quiz, leaderboard };
  }

  async startAttempt(user: EngineUser, quizId: string): Promise<{
    quiz: GlobalQuiz;
    attempt: GlobalQuizAttempt;
    remainingAttempts: number | null;
  }> {
    const db = this.getDb();
    const quiz = await this.getQuizById(quizId);
    if (!quiz || quiz.status !== "published") {
      throw new Error("QUIZ_NOT_FOUND");
    }

    const existingStats =
      (await this.getUserStats(quizId, user.uid)) ??
      createInitialGlobalQuizUserStats(quiz, user);

    if (existingStats.activeAttemptId) {
      const activeAttempt = await this.getAttempt(quizId, existingStats.activeAttemptId);
      if (activeAttempt && activeAttempt.status === "in_progress") {
        return {
          quiz,
          attempt: activeAttempt,
          remainingAttempts: getRemainingAttempts(quiz, existingStats),
        };
      }
    }

    const remainingAttempts = getRemainingAttempts(quiz, existingStats);
    if (remainingAttempts !== null && remainingAttempts <= 0) {
      throw new Error("ATTEMPT_LIMIT_REACHED");
    }

    const now = Date.now();
    const attemptId = crypto.randomUUID();
    const attempt: GlobalQuizAttempt = {
      id: attemptId,
      quizId,
      userId: user.uid,
      username: user.username ?? "Usuário",
      email: user.email ?? "",
      status: "in_progress",
      currentQuestionIndex: 0,
      questionStartTimestamp: now,
      answers: {},
      totalScore: 0,
      totalResponseTime: 0,
      startedAt: now,
      updatedAt: now,
      completedAt: null,
    };

    const stats: GlobalQuizUserStats = {
      ...existingStats,
      username: user.username ?? existingStats.username,
      email: user.email ?? existingStats.email,
      attemptsUsed: existingStats.attemptsUsed + 1,
      activeAttemptId: attemptId,
      lastAttemptAt: now,
      updatedAt: now,
    };

    await db.ref(`${GLOBAL_QUIZ_ATTEMPTS_PATH}/${quizId}/${attemptId}`).set(attempt);
    await db.ref(`${GLOBAL_QUIZ_USER_STATS_PATH}/${quizId}/${user.uid}`).set(stats);

    return {
      quiz,
      attempt,
      remainingAttempts:
        remainingAttempts === null ? null : Math.max(0, remainingAttempts - 1),
    };
  }

  async submitAnswer(
    user: EngineUser,
    quizId: string,
    optionIndex: number | null
  ): Promise<{
    quiz: GlobalQuiz;
    attempt: GlobalQuizAttempt;
    answer: GlobalQuizAttemptAnswer;
    completed: boolean;
    leaderboard: GlobalQuizLeaderboardEntry[];
  }> {
    const db = this.getDb();
    const quiz = await this.getQuizById(quizId);
    if (!quiz || quiz.status !== "published") {
      throw new Error("QUIZ_NOT_FOUND");
    }

    const stats = await this.getUserStats(quizId, user.uid);
    if (!stats?.activeAttemptId) {
      throw new Error("NO_ACTIVE_ATTEMPT");
    }

    const attempt = await this.getAttempt(quizId, stats.activeAttemptId);
    if (!attempt || attempt.status !== "in_progress") {
      throw new Error("NO_ACTIVE_ATTEMPT");
    }

    const questions = Array.isArray(quiz.questions)
      ? quiz.questions.map((q) => normalizeQuestionFromFirebase(q ?? {}))
      : [];
    const question = questions[attempt.currentQuestionIndex];
    if (!question) {
      throw new Error("QUESTION_NOT_FOUND");
    }

    const questionKey = String(attempt.currentQuestionIndex);
    const answers = attempt.answers ?? {};
    if (answers[questionKey]) {
      throw new Error("ANSWER_ALREADY_SUBMITTED");
    }

    if (
      optionIndex !== null &&
      (optionIndex < 0 || optionIndex >= question.options.length)
    ) {
      throw new Error("INVALID_OPTION");
    }

    const timeLimitMs = quiz.questionTimeLimitMs;
    const rawResponseTime = Math.max(
      0,
      Date.now() - (attempt.questionStartTimestamp ?? attempt.updatedAt)
    );
    const responseTime = Math.min(rawResponseTime, timeLimitMs);
    const correct =
      optionIndex !== null && optionIndex === question.correctOptionIndex;
    const score = calculateTimedScore(correct, responseTime, timeLimitMs);

    const answer: GlobalQuizAttemptAnswer = {
      questionIndex: attempt.currentQuestionIndex,
      optionIndex,
      timestamp: Date.now(),
      responseTime,
      score,
      correct,
    };

    const isLastQuestion = attempt.currentQuestionIndex >= quiz.questions.length - 1;
    const now = Date.now();
    const nextAttempt: GlobalQuizAttempt = {
      ...attempt,
      answers: {
        ...answers,
        [questionKey]: answer,
      },
      totalScore: attempt.totalScore + score,
      totalResponseTime: attempt.totalResponseTime + responseTime,
      currentQuestionIndex: isLastQuestion
        ? attempt.currentQuestionIndex + 1
        : attempt.currentQuestionIndex + 1,
      questionStartTimestamp: isLastQuestion ? null : now,
      status: isLastQuestion ? "completed" : "in_progress",
      updatedAt: now,
      completedAt: isLastQuestion ? now : null,
    };

    await db.ref(`${GLOBAL_QUIZ_ATTEMPTS_PATH}/${quizId}/${attempt.id}`).set(nextAttempt);

    if (!isLastQuestion) {
      return {
        quiz,
        attempt: nextAttempt,
        answer,
        completed: false,
        leaderboard: await this.getLeaderboard(quizId),
      };
    }

    const existingLeaderboard = await this.getLeaderboardEntry(quizId, user.uid);
    const updatedStats: GlobalQuizUserStats = {
      ...stats,
      username: user.username ?? stats.username,
      email: user.email ?? stats.email,
      activeAttemptId: null,
      bestScore:
        nextAttempt.totalScore > stats.bestScore
          ? nextAttempt.totalScore
          : stats.bestScore,
      bestResponseTime:
        nextAttempt.totalScore > stats.bestScore ||
        (nextAttempt.totalScore === stats.bestScore &&
          nextAttempt.totalResponseTime < stats.bestResponseTime)
          ? nextAttempt.totalResponseTime
          : stats.bestResponseTime,
      bestAttemptId:
        nextAttempt.totalScore > stats.bestScore ||
        (nextAttempt.totalScore === stats.bestScore &&
          nextAttempt.totalResponseTime < stats.bestResponseTime)
          ? nextAttempt.id
          : stats.bestAttemptId,
      updatedAt: now,
    };

    await db.ref(`${GLOBAL_QUIZ_USER_STATS_PATH}/${quizId}/${user.uid}`).set(updatedStats);

    if (shouldReplaceLeaderboardEntry(existingLeaderboard, nextAttempt)) {
      const leaderboardEntry: GlobalQuizLeaderboardEntry = {
        quizId,
        userId: user.uid,
        username: user.username ?? stats.username,
        score: nextAttempt.totalScore,
        totalResponseTime: nextAttempt.totalResponseTime,
        attemptId: nextAttempt.id,
        completedAt: nextAttempt.completedAt ?? now,
      };
      await db
        .ref(`${GLOBAL_QUIZ_LEADERBOARD_PATH}/${quizId}/${user.uid}`)
        .set(leaderboardEntry);
    }

    return {
      quiz,
      attempt: nextAttempt,
      answer,
      completed: true,
      leaderboard: await this.getLeaderboard(quizId),
    };
  }

  async finishAttempt(user: EngineUser, quizId: string): Promise<GlobalQuizAttempt> {
    const db = this.getDb();
    const stats = await this.getUserStats(quizId, user.uid);
    if (!stats?.activeAttemptId) {
      throw new Error("NO_ACTIVE_ATTEMPT");
    }

    const attempt = await this.getAttempt(quizId, stats.activeAttemptId);
    if (!attempt || attempt.status !== "in_progress") {
      throw new Error("NO_ACTIVE_ATTEMPT");
    }

    const finishedAttempt: GlobalQuizAttempt = {
      ...attempt,
      status: "abandoned",
      questionStartTimestamp: null,
      updatedAt: Date.now(),
      completedAt: Date.now(),
    };

    const nextStats: GlobalQuizUserStats = {
      ...stats,
      activeAttemptId: null,
      updatedAt: Date.now(),
    };

    await db.ref(`${GLOBAL_QUIZ_ATTEMPTS_PATH}/${quizId}/${attempt.id}`).set(finishedAttempt);
    await db.ref(`${GLOBAL_QUIZ_USER_STATS_PATH}/${quizId}/${user.uid}`).set(nextStats);

    return finishedAttempt;
  }

  async getAdminEntries(
    quizId: string,
    user: EngineUser
  ): Promise<GlobalQuizAdminUserEntry[]> {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) throw new Error("QUIZ_NOT_FOUND");
    if (quiz.createdBy !== user.uid && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }

    const db = this.getDb();
    const snapshot = await db.ref(`${GLOBAL_QUIZ_USER_STATS_PATH}/${quizId}`).get();
    const statsMap = snapshot.val() as Record<string, GlobalQuizUserStats> | null;
    if (!statsMap) return [];

    return Object.values(statsMap)
      .map((stats) => ({
        ...stats,
        attemptLimit: quiz.attemptLimit,
        remainingAttempts: getRemainingAttempts(quiz, stats),
      }))
      .sort((a, b) => {
        if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
        return a.username.localeCompare(b.username, "pt-BR");
      });
  }

  async grantExtraAttempts(
    quizId: string,
    user: EngineUser,
    targetUserId: string,
    extraAttempts: number
  ): Promise<GlobalQuizAdminUserEntry> {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) throw new Error("QUIZ_NOT_FOUND");
    if (quiz.createdBy !== user.uid && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (!Number.isInteger(extraAttempts) || extraAttempts <= 0) {
      throw new Error("INVALID_EXTRA_ATTEMPTS");
    }

    const db = this.getDb();
    const existing =
      (await this.getUserStats(quizId, targetUserId)) ??
      ({
        quizId,
        userId: targetUserId,
        username: targetUserId,
        email: "",
        attemptsUsed: 0,
        extraAttemptsGranted: 0,
        activeAttemptId: null,
        bestScore: 0,
        bestResponseTime: Number.MAX_SAFE_INTEGER,
        bestAttemptId: null,
        lastAttemptAt: null,
        updatedAt: Date.now(),
      } as GlobalQuizUserStats);

    const updated: GlobalQuizUserStats = {
      ...existing,
      extraAttemptsGranted: existing.extraAttemptsGranted + extraAttempts,
      updatedAt: Date.now(),
    };

    await db.ref(`${GLOBAL_QUIZ_USER_STATS_PATH}/${quizId}/${targetUserId}`).set(updated);

    return {
      ...updated,
      attemptLimit: quiz.attemptLimit,
      remainingAttempts: getRemainingAttempts(quiz, updated),
    };
  }
}
