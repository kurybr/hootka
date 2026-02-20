"use client";

import { io, type Socket } from "socket.io-client";
import type {
  AnswerCountData,
  AnswerResultData,
  ErrorData,
  GameStatusData,
  IRealTimeProvider,
} from "./IRealTimeProvider";
import type { Participant, Question, Room } from "@/types/quiz";

const HOST_ID_KEY = "quiz_hostId";

function getOrCreateHostId(): string {
  if (typeof window === "undefined") return "";
  let hostId = localStorage.getItem(HOST_ID_KEY);
  if (!hostId) {
    hostId = crypto.randomUUID();
    localStorage.setItem(HOST_ID_KEY, hostId);
  }
  return hostId;
}

export class SocketIOProvider implements IRealTimeProvider {
  private socket: Socket | null = null;
  private roomId: string | null = null;
  private role: "host" | "participant" | null = null;
  private participantId: string | null = null;
  private lastRoomState: Room | null = null;

  private roomStateListeners: Set<(room: Room) => void> = new Set();
  private participantJoinedListeners: Set<(p: Participant) => void> =
    new Set();
  private gameStatusListeners: Set<(data: GameStatusData) => void> = new Set();
  private answerCountListeners: Set<(data: AnswerCountData) => void> =
    new Set();
  private answerResultListeners: Set<(data: AnswerResultData) => void> =
    new Set();
  private rankingListeners: Set<(participants: Participant[]) => void> =
    new Set();
  private errorListeners: Set<(error: ErrorData) => void> = new Set();

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("room:state", (room: Room) => {
      this.lastRoomState = room;
      this.roomStateListeners.forEach((cb) => cb(room));
    });

    this.socket.on("room:participant-joined", (participant: Participant) => {
      this.participantJoinedListeners.forEach((cb) => cb(participant));
    });

    this.socket.on(
      "game:status-changed",
      (data: { status: Room["status"]; questionIndex: number; timestamp: number | null }) => {
        this.gameStatusListeners.forEach((cb) => cb(data));
      }
    );

    this.socket.on("game:answer-count", (data: AnswerCountData) => {
      this.answerCountListeners.forEach((cb) => cb(data));
    });

    this.socket.on("answer:result", (data: AnswerResultData) => {
      this.answerResultListeners.forEach((cb) => cb(data));
    });

    this.socket.on("ranking:update", (participants: Participant[]) => {
      this.rankingListeners.forEach((cb) => cb(participants));
    });

    this.socket.on("error", (data: ErrorData) => {
      this.errorListeners.forEach((cb) => cb(data));
    });
  }

  private ensureConnected(hostId?: string, participantId?: string): void {
    if (this.socket?.connected) return;

    const url = typeof window !== "undefined" ? window.location.origin : "";
    this.socket = io(url, {
      auth: { hostId: hostId ?? undefined, participantId: participantId ?? undefined },
    });
    this.setupListeners();
  }

  connect(roomId: string, role: "host" | "participant"): void {
    this.roomId = roomId;
    this.role = role;

    if (role === "host") {
      const hostId = getOrCreateHostId();
      this.ensureConnected(hostId);
    } else {
      const participantId = localStorage.getItem("quiz_participantId");
      this.ensureConnected(undefined, participantId ?? undefined);
    }

  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.roomId = null;
    this.role = null;
    this.participantId = null;
  }

  async createRoom(questions: Question[]): Promise<{ roomId: string; code: string }> {
    return new Promise((resolve, reject) => {
      const hostId = getOrCreateHostId();
      this.ensureConnected(hostId);

      if (!this.socket) {
        reject(new Error("Não foi possível conectar"));
        return;
      }

      const onCreated = (data: { roomId: string; code: string }) => {
        this.socket?.off("room:created", onCreated);
        this.socket?.off("error", onError);
        this.roomId = data.roomId;
        this.role = "host";
        resolve(data);
      };

      const onError = (data: ErrorData) => {
        this.socket?.off("room:created", onCreated);
        this.socket?.off("error", onError);
        reject(new Error(data.message));
      };

      this.socket.once("room:created", onCreated);
      this.socket.once("error", onError);

      this.socket.emit("room:create" as never, { questions } as never);
    });
  }

  async joinRoom(
    code: string,
    name: string
  ): Promise<{ participantId: string; roomId: string }> {
    void code;
    void name;
    throw new Error("joinRoom será implementado no Prompt 5");
  }

  startGame(): void {
    this.socket?.emit("game:start" as never);
  }

  nextQuestion(): void {
    this.socket?.emit("game:next-question" as never);
  }

  endGame(): void {
    this.socket?.emit("game:end" as never);
  }

  submitAnswer(optionIndex: number): void {
    void optionIndex;
    throw new Error("submitAnswer será implementado no Prompt 9");
  }

  onRoomState(callback: (room: Room) => void): () => void {
    this.roomStateListeners.add(callback);
    if (this.lastRoomState) callback(this.lastRoomState);
    return () => this.roomStateListeners.delete(callback);
  }

  onParticipantJoined(callback: (participant: Participant) => void): () => void {
    this.participantJoinedListeners.add(callback);
    return () => this.participantJoinedListeners.delete(callback);
  }

  onGameStatusChanged(callback: (data: GameStatusData) => void): () => void {
    this.gameStatusListeners.add(callback);
    return () => this.gameStatusListeners.delete(callback);
  }

  onAnswerCount(callback: (data: AnswerCountData) => void): () => void {
    this.answerCountListeners.add(callback);
    return () => this.answerCountListeners.delete(callback);
  }

  onAnswerResult(callback: (data: AnswerResultData) => void): () => void {
    this.answerResultListeners.add(callback);
    return () => this.answerResultListeners.delete(callback);
  }

  onRankingUpdate(callback: (participants: Participant[]) => void): () => void {
    this.rankingListeners.add(callback);
    return () => this.rankingListeners.delete(callback);
  }

  onError(callback: (error: ErrorData) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }
}
