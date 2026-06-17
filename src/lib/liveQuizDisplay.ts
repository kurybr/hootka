import { resolveQuestionTimeLimitMs } from "@/lib/questionUtils";
import type { Room } from "@/types/quiz";

export function formatLiveRoomSubtitle(room: Room | null): string {
  if (!room?.code) return "Sala ao vivo";
  const timeSec = resolveQuestionTimeLimitMs(room.questionTimeLimitMs) / 1000;
  const questionLabel =
    room.questions.length === 1
      ? "1 pergunta"
      : `${room.questions.length} perguntas`;
  return `Sala ${room.code} · ${questionLabel} · ${timeSec}s por pergunta`;
}

export function formatRoomCodeLabel(room: Room | null): string {
  return room?.code ? `Sala ${room.code}` : "Sala ao vivo";
}
