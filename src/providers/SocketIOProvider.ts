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
const PARTICIPANT_ID_KEY = "quiz_participantId";

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
  private _roomId: string | null = null;
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
  private participantDisconnectedListeners: Set<
    (data: { participantId: string }) => void
  > = new Set();
  private participantReconnectedListeners: Set<(p: Participant) => void> =
    new Set();
  private hostDisconnectedListeners: Set<() => void> = new Set();
  private connectionStateListeners: Set<(connected: boolean) => void> =
    new Set();

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

    this.socket.on(
      "room:participant-disconnected",
      (data: { participantId: string }) => {
        if (this.lastRoomState?.participants[data.participantId]) {
          this.lastRoomState.participants[data.participantId].connected = false;
        }
        this.participantDisconnectedListeners.forEach((cb) => cb(data));
        if (this.lastRoomState) {
          this.roomStateListeners.forEach((cb) => cb(this.lastRoomState!));
        }
      }
    );

    this.socket.on("room:participant-reconnected", (participant: Participant) => {
      if (this.lastRoomState?.participants[participant.id]) {
        this.lastRoomState.participants[participant.id] = { ...participant };
      }
      this.participantReconnectedListeners.forEach((cb) => cb(participant));
      if (this.lastRoomState) {
        this.roomStateListeners.forEach((cb) => cb(this.lastRoomState!));
      }
    });

    this.socket.on("room:host-disconnected", () => {
      this.hostDisconnectedListeners.forEach((cb) => cb());
    });

    this.socket.on("connect", () => {
      this.connectionStateListeners.forEach((cb) => cb(true));
      if (this._roomId && this.role) {
        this.socket?.emit("room:rejoin" as never, { roomId: this._roomId } as never);
      }
    });

    this.socket.on("disconnect", () => {
      this.connectionStateListeners.forEach((cb) => cb(false));
    });

    this.socket.on("connect_error", () => {
      this.connectionStateListeners.forEach((cb) => cb(false));
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
    this._roomId = roomId;
    this.role = role;

    if (role === "host") {
      const hostId = getOrCreateHostId();
      this.ensureConnected(hostId);
    } else {
      const participantId = localStorage.getItem(PARTICIPANT_ID_KEY);
      this.ensureConnected(undefined, participantId ?? undefined);
    }

  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._roomId = null;
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
        this._roomId = data.roomId;
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
    return new Promise((resolve, reject) => {
      const storedParticipantId =
        typeof window !== "undefined"
          ? localStorage.getItem(PARTICIPANT_ID_KEY)
          : null;
      this.ensureConnected(undefined, storedParticipantId ?? undefined);

      if (!this.socket) {
        reject(new Error("Não foi possível conectar"));
        return;
      }

      const onJoined = (data: { participantId: string; roomId: string }) => {
        this.socket?.off("room:joined", onJoined);
        this.socket?.off("error", onError);
        this._roomId = data.roomId;
        this.role = "participant";
        this.participantId = data.participantId;
        localStorage.setItem(PARTICIPANT_ID_KEY, data.participantId);
        resolve(data);
      };

      const onError = (data: ErrorData) => {
        this.socket?.off("room:joined", onJoined);
        this.socket?.off("error", onError);
        reject(new Error(data.message));
      };

      this.socket.once("room:joined", onJoined);
      this.socket.once("error", onError);

      this.socket.emit("room:join" as never, { code, name } as never);
    });
  }

  startGame(): void {
    this.socket?.emit("game:start" as never);
  }

  nextQuestion(): void {
    this.socket?.emit("game:next-question" as never);
  }

  forceResult(): void {
    this.socket?.emit("game:force-result" as never);
  }

  endGame(): void {
    this.socket?.emit("game:end" as never);
  }

  submitAnswer(optionIndex: number): void {
    this.socket?.emit("answer:submit" as never, { optionIndex } as never);
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

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get roomId(): string | null {
    return this._roomId;
  }

  onConnectionStateChange(callback: (connected: boolean) => void): () => void {
    callback(this.isConnected);
    this.connectionStateListeners.add(callback);
    return () => this.connectionStateListeners.delete(callback);
  }

  onParticipantDisconnected(
    callback: (data: { participantId: string }) => void
  ): () => void {
    this.participantDisconnectedListeners.add(callback);
    return () => this.participantDisconnectedListeners.delete(callback);
  }

  onParticipantReconnected(callback: (participant: Participant) => void): () => void {
    this.participantReconnectedListeners.add(callback);
    return () => this.participantReconnectedListeners.delete(callback);
  }

  onHostDisconnected(callback: () => void): () => void {
    this.hostDisconnectedListeners.add(callback);
    return () => this.hostDisconnectedListeners.delete(callback);
  }
}
