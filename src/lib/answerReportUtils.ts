import type { GlobalQuizAttempt, Question, Room } from "@/types/quiz";

export interface QuestionAnswerReportEntry {
  questionIndex: number;
  question: Question;
  counts: number[];
  totalAnswered: number;
  totalSessions: number;
  correctRate: number;
}

export interface QuizAnswerReport {
  totalSessions: number;
  questionCount: number;
  sessionsLabel: string;
  entries: QuestionAnswerReportEntry[];
}

function aggregateQuestionAnswers(
  questions: Question[],
  questionIndex: number,
  answers: Array<{ optionIndex: number }>
): Pick<QuestionAnswerReportEntry, "counts" | "totalAnswered" | "correctRate"> {
  const question = questions[questionIndex];
  const counts = Array.from({ length: question.options.length }, () => 0);
  let correct = 0;

  for (const answer of answers) {
    if (answer.optionIndex >= 0 && answer.optionIndex < counts.length) {
      counts[answer.optionIndex]++;
      if (answer.optionIndex === question.correctOptionIndex) {
        correct++;
      }
    }
  }

  const totalAnswered = answers.length;
  return {
    counts,
    totalAnswered,
    correctRate: totalAnswered > 0 ? (correct / totalAnswered) * 100 : 0,
  };
}

export function buildRoomAnswerReport(room: Room): QuizAnswerReport {
  const questions = room.questions ?? [];
  const totalSessions = Object.keys(room.participants ?? {}).length;

  const entries = questions.map((question, questionIndex) => {
    const qKey = String(questionIndex);
    const answers = Object.values(room.answers?.[qKey] ?? {}).map((answer) => ({
      optionIndex: answer.optionIndex,
    }));
    const aggregated = aggregateQuestionAnswers(questions, questionIndex, answers);

    return {
      questionIndex,
      question,
      totalSessions,
      ...aggregated,
    };
  });

  return {
    totalSessions,
    questionCount: questions.length,
    sessionsLabel: "participantes",
    entries,
  };
}

export function buildGlobalQuizAnswerReport(
  questions: Question[],
  attempts: GlobalQuizAttempt[]
): QuizAnswerReport {
  const completedAttempts = attempts.filter((attempt) => attempt.status === "completed");
  const totalSessions = completedAttempts.length;

  const entries = questions.map((question, questionIndex) => {
    const qKey = String(questionIndex);
    const answers = completedAttempts
      .map((attempt) => attempt.answers?.[qKey])
      .filter(
        (answer): answer is NonNullable<typeof answer> =>
          answer != null && typeof answer.optionIndex === "number"
      )
      .map((answer) => ({ optionIndex: answer.optionIndex as number }));
    const aggregated = aggregateQuestionAnswers(questions, questionIndex, answers);

    return {
      questionIndex,
      question,
      totalSessions,
      ...aggregated,
    };
  });

  return {
    totalSessions,
    questionCount: questions.length,
    sessionsLabel: "tentativas concluídas",
    entries,
  };
}
