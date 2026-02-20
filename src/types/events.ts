import type { Participant, Question, Room } from "./quiz";

export interface ClientEvents {
  "room:create": (data: { questions: Question[] }) => void;
  "room:join": (data: { code: string; name: string }) => void;
  "game:start": () => void;
  "game:next-question": () => void;
  "game:force-result": () => void;
  "game:end": () => void;
  "answer:submit": (data: { optionIndex: number }) => void;
}

export interface ServerEvents {
  "room:created": (data: { roomId: string; code: string }) => void;
  "room:joined": (data: { participantId: string; roomId: string }) => void;
  "room:state": (data: Room) => void;
  "room:participant-joined": (data: Participant) => void;
  "game:status-changed": (data: {
    status: Room["status"];
    questionIndex: number;
    timestamp: number | null;
  }) => void;
  "game:answer-count": (data: { count: number; total: number }) => void;
  "answer:result": (data: {
    correct: boolean;
    score: number;
    correctIndex: number;
  }) => void;
  "ranking:update": (data: Participant[]) => void;
  error: (data: { message: string; code: string }) => void;
}
