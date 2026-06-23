import type { Room } from "@/types/quiz";
import { optionIndexToLetter } from "@/lib/liveReportCsvExport";

export interface ParticipantAnswerRow {
  questionNumber: number;
  questionText: string;
  optionLetter: string;
  optionText: string;
  responded: boolean;
  correct: boolean | null;
  responseTimeMs: number | null;
  timestamp: string;
}

export interface ParticipantAnswerReport {
  participantName: string;
  roomCode: string;
  participantId: string;
  rows: ParticipantAnswerRow[];
}

export function buildParticipantAnswerReport(
  room: Room,
  participantId: string
): ParticipantAnswerReport {
  const participant = room.participants?.[participantId];
  if (!participant) {
    throw new Error("PARTICIPANTE_NAO_ENCONTRADO");
  }

  const questions = room.questions ?? [];
  const answers = room.answers ?? {};

  const rows: ParticipantAnswerRow[] = questions.map((question, index) => {
    const answer = answers[String(index)]?.[participantId];
    const responded = Boolean(answer);

    if (!responded || answer == null) {
      return {
        questionNumber: index + 1,
        questionText: question.text,
        optionLetter: "",
        optionText: "",
        responded: false,
        correct: null,
        responseTimeMs: null,
        timestamp: "",
      };
    }

    const optionIndex = answer.optionIndex;
    const optionText =
      optionIndex >= 0 && optionIndex < question.options.length
        ? question.options[optionIndex]
        : "";

    return {
      questionNumber: index + 1,
      questionText: question.text,
      optionLetter: optionIndexToLetter(optionIndex),
      optionText,
      responded: true,
      correct: optionIndex === question.correctOptionIndex,
      responseTimeMs: answer.responseTime,
      timestamp: new Date(answer.timestamp).toISOString(),
    };
  });

  return {
    participantName: participant.name,
    roomCode: room.code,
    participantId,
    rows,
  };
}

export function slugifyParticipantName(name: string): string {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (normalized || "participante").slice(0, 40);
}
