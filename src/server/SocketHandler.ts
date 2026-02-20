import { Server } from "socket.io";
import type { Socket } from "socket.io";
import { GameEngine } from "./GameEngine";
import { InMemoryStore } from "./InMemoryStore";
import { serverMetrics } from "../lib/serverMetrics";
import type { ClientEvents, ServerEvents } from "../types/events";

const QUESTION_TIMEOUT_MS = 120000;

const questionTimers = new Map<string, NodeJS.Timeout>();

function scheduleQuestionTimeout(
  io: TypedServer,
  roomId: string,
  engine: GameEngine,
  store: InstanceType<typeof InMemoryStore>
): void {
  const existing = questionTimers.get(roomId);
  if (existing) clearTimeout(existing);

  const timeoutId = setTimeout(async () => {
    questionTimers.delete(roomId);
    try {
      const room = await store.getRoom(roomId);
      if (!room || room.status !== "playing") return;

      await engine.transitionToResult(roomId);
      const finalRoom = await store.getRoom(roomId);
      if (finalRoom) {
        const ranking = engine.getRanking(finalRoom);
        io.to(roomId).emit("game:status-changed" as keyof ServerEvents, {
          status: finalRoom.status,
          questionIndex: finalRoom.currentQuestionIndex,
          timestamp: null,
        });
        io.to(roomId).emit("room:state" as keyof ServerEvents, finalRoom);
        io.to(roomId).emit("ranking:update" as keyof ServerEvents, ranking);
      }
    } catch {
      // Ignore
    }
  }, QUESTION_TIMEOUT_MS);

  questionTimers.set(roomId, timeoutId);
}

type TypedServer = Server & {
  on(
    event: keyof ClientEvents,
    callback: (socket: Socket, ...args: unknown[]) => void
  ): void;
};

export function setupSocketHandler(io: TypedServer): void {
  const store = new InMemoryStore();
  const engine = new GameEngine(store);

  io.on("connection", (socket: Socket) => {
    serverMetrics.incrementConnections();
    const hostId = (socket.handshake.auth as { hostId?: string })?.hostId;
    const participantId = (socket.handshake.auth as { participantId?: string })
      ?.participantId;

    socket.on(
      "room:rejoin" as keyof ClientEvents,
      async (data: { roomId: string }) => {
        const roomId = data.roomId;
        const room = await store.getRoom(roomId);
        if (!room) return;

        if (hostId && room.hostId === hostId) {
          socket.join(roomId);
          socket.data.roomId = roomId;
          socket.data.role = "host";
          socket.data.hostId = hostId;
          socket.emit("room:state" as keyof ServerEvents, room);
          return;
        }

        if (participantId && room.participants[participantId]) {
          await store.updateParticipantConnection(
            roomId,
            participantId,
            true
          );
          const updatedRoom = await store.getRoom(roomId);
          if (!updatedRoom) return;
          socket.join(roomId);
          socket.data.roomId = roomId;
          socket.data.role = "participant";
          socket.data.participantId = participantId;
          socket.emit("room:state" as keyof ServerEvents, updatedRoom);
          socket.to(roomId).emit(
            "room:participant-reconnected" as keyof ServerEvents,
            updatedRoom.participants[participantId]
          );
          const ranking = engine.getRanking(updatedRoom);
          io.to(roomId).emit("ranking:update" as keyof ServerEvents, ranking);
        } else if (participantId || room.hostId !== hostId) {
          socket.emit("room:access-denied" as keyof ServerEvents, {
            reason: "Você precisa entrar na sala primeiro. Digite o código da sala.",
          });
        }
      }
    );

    socket.on("disconnect", async () => {
      serverMetrics.decrementConnections();
      const roomId = socket.data.roomId as string | undefined;
      const role = socket.data.role as string | undefined;
      const effectiveParticipantId =
        socket.data.participantId ?? participantId;

      if (!roomId) return;

      if (role === "host") {
        io.to(roomId).emit("room:host-disconnected" as keyof ServerEvents);
        return;
      }

      if (effectiveParticipantId) {
        await store.updateParticipantConnection(
          roomId,
          effectiveParticipantId,
          false
        );
        io.to(roomId).emit(
          "room:participant-disconnected" as keyof ServerEvents,
          { participantId: effectiveParticipantId }
        );
        const updatedRoom = await store.getRoom(roomId);
        if (updatedRoom) {
          const ranking = engine.getRanking(updatedRoom);
          io.to(roomId).emit("ranking:update" as keyof ServerEvents, ranking);
        }
      }
    });

    socket.on(
      "room:create" as keyof ClientEvents,
      async (data: { questions: unknown[] }) => {
        try {
          const questions = data.questions as Parameters<
            GameEngine["createRoom"]
          >[0];
          if (!hostId) {
            socket.emit("error", {
              message: "HostId é obrigatório para criar sala",
              code: "HOSTID_REQUERIDO",
            });
            return;
          }
          const room = await engine.createRoom(questions, hostId);
          socket.join(room.id);
          socket.data.roomId = room.id;
          socket.data.role = "host";
          socket.data.hostId = hostId;
          socket.emit("room:created" as keyof ServerEvents, {
            roomId: room.id,
            code: room.code,
          });
          socket.emit("room:state" as keyof ServerEvents, room);
        } catch (err) {
          socket.emit("error", {
            message: err instanceof Error ? err.message : "Erro ao criar sala",
            code: "ERRO_CRIAR_SALA",
          });
        }
      }
    );

    socket.on(
      "room:join" as keyof ClientEvents,
      async (data: { code: string; name: string }) => {
        try {
          const { room, participant } = await engine.joinRoom(
            data.code,
            data.name
          );
          socket.join(room.id);
          socket.data.roomId = room.id;
          socket.data.role = "participant";
          socket.data.participantId = participant.id;
          socket.emit("room:joined" as keyof ServerEvents, {
            participantId: participant.id,
            roomId: room.id,
          });
          socket.emit("room:state" as keyof ServerEvents, room);
          socket.to(room.id).emit("room:participant-joined" as keyof ServerEvents, participant);
          const ranking = engine.getRanking(room);
          io.to(room.id).emit("ranking:update" as keyof ServerEvents, ranking);
        } catch (err) {
          const code =
            err instanceof Error ? err.message : "ERRO_ENTRAR_SALA";
          socket.emit("error", {
            message:
              code === "SALA_NAO_ENCONTRADA"
                ? "Sala não encontrada"
                : code === "SALA_JA_INICIADA"
                  ? "Esta sala já está em andamento"
                  : code === "NOME_DUPLICADO"
                    ? "Nome já utilizado nesta sala"
                    : "Erro ao entrar na sala",
            code,
          });
        }
      }
    );

    socket.on("game:start" as keyof ClientEvents, async () => {
      const roomId = socket.data.roomId as string | undefined;
      const effectiveHostId = socket.data.hostId ?? hostId;
      if (!roomId || !effectiveHostId) return;
      try {
        const room = await engine.startGame(roomId, effectiveHostId);
        const { count, total } = engine.getAnswerCount(
          room,
          room.currentQuestionIndex
        );
        const ranking = engine.getRanking(room);
        socket.emit("game:status-changed" as keyof ServerEvents, {
          status: room.status,
          questionIndex: room.currentQuestionIndex,
          timestamp: room.questionStartTimestamp,
        });
        socket.emit("room:state" as keyof ServerEvents, room);
        io.to(roomId).emit("game:status-changed" as keyof ServerEvents, {
          status: room.status,
          questionIndex: room.currentQuestionIndex,
          timestamp: room.questionStartTimestamp,
        });
        io.to(roomId).emit("room:state" as keyof ServerEvents, room);
        io.to(roomId).emit("game:answer-count" as keyof ServerEvents, {
          count,
          total,
        });
        io.to(roomId).emit("ranking:update" as keyof ServerEvents, ranking);
        scheduleQuestionTimeout(io, roomId, engine, store);
      } catch (err) {
        socket.emit("error", {
          message: err instanceof Error ? err.message : "Erro ao iniciar jogo",
          code: "ERRO_INICIAR",
        });
      }
    });

    socket.on("game:force-result" as keyof ClientEvents, async () => {
      const roomId = socket.data.roomId as string | undefined;
      const effectiveHostId = socket.data.hostId ?? hostId;
      if (!roomId || !effectiveHostId) return;
      try {
        const existingTimer = questionTimers.get(roomId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          questionTimers.delete(roomId);
        }
        const room = await engine.forceResult(roomId, effectiveHostId);
        const ranking = engine.getRanking(room);
        io.to(roomId).emit("game:status-changed" as keyof ServerEvents, {
          status: room.status,
          questionIndex: room.currentQuestionIndex,
          timestamp: null,
        });
        io.to(roomId).emit("room:state" as keyof ServerEvents, room);
        io.to(roomId).emit("ranking:update" as keyof ServerEvents, ranking);
      } catch (err) {
        socket.emit("error", {
          message:
            err instanceof Error
              ? err.message
              : "Erro ao encerrar pergunta",
          code: "ERRO_ENCERRAR_PERGUNTA",
        });
      }
    });

    socket.on("game:next-question" as keyof ClientEvents, async () => {
      const roomId = socket.data.roomId as string | undefined;
      const effectiveHostId = socket.data.hostId ?? hostId;
      if (!roomId || !effectiveHostId) return;
      try {
        const room = await engine.nextQuestion(roomId, effectiveHostId);
        const { count, total } = engine.getAnswerCount(
          room,
          room.currentQuestionIndex
        );
        io.to(roomId).emit("game:status-changed" as keyof ServerEvents, {
          status: room.status,
          questionIndex: room.currentQuestionIndex,
          timestamp: room.questionStartTimestamp,
        });
        io.to(roomId).emit("room:state" as keyof ServerEvents, room);
        io.to(roomId).emit("game:answer-count" as keyof ServerEvents, {
          count,
          total,
        });
        scheduleQuestionTimeout(io, roomId, engine, store);
      } catch (err) {
        socket.emit("error", {
          message:
            err instanceof Error ? err.message : "Erro ao avançar pergunta",
          code: "ERRO_AVANCAR",
        });
      }
    });

    socket.on("game:end" as keyof ClientEvents, async () => {
      const roomId = socket.data.roomId as string | undefined;
      const effectiveHostId = socket.data.hostId ?? hostId;
      if (!roomId || !effectiveHostId) return;
      try {
        const room = await engine.endGame(roomId, effectiveHostId);
        io.to(roomId).emit("game:status-changed" as keyof ServerEvents, {
          status: room.status,
          questionIndex: room.currentQuestionIndex,
          timestamp: null,
        });
        io.to(roomId).emit("room:state" as keyof ServerEvents, room);
      } catch (err) {
        socket.emit("error", {
          message: err instanceof Error ? err.message : "Erro ao encerrar jogo",
          code: "ERRO_ENCERRAR",
        });
      }
    });

    socket.on(
      "answer:submit" as keyof ClientEvents,
      async (data: { optionIndex: number }) => {
        const roomId = socket.data.roomId as string | undefined;
        const effectiveParticipantId =
          socket.data.participantId ?? participantId;
        if (!roomId || !effectiveParticipantId) return;
        const room = await store.getRoom(roomId);
        if (!room) return;
        const questionIndex = room.currentQuestionIndex;
        try {
          const result = await engine.submitAnswer(
            roomId,
            effectiveParticipantId,
            questionIndex,
            data.optionIndex
          );
          serverMetrics.incrementAnswersProcessed();
          socket.emit("answer:result" as keyof ServerEvents, {
            correct: result.correct,
            score: result.score,
            correctIndex: result.correctIndex,
          });
          const updatedRoom = await store.getRoom(roomId);
          if (updatedRoom) {
            const { count, total } = engine.getAnswerCount(
              updatedRoom,
              questionIndex
            );
            io.to(roomId).emit("game:answer-count" as keyof ServerEvents, {
              count,
              total,
            });
            const ranking = engine.getRanking(updatedRoom);
            io.to(roomId).emit("ranking:update" as keyof ServerEvents, ranking);
            if (result.shouldTransitionToResult) {
              const existingTimer = questionTimers.get(roomId);
              if (existingTimer) {
                clearTimeout(existingTimer);
                questionTimers.delete(roomId);
              }
              await engine.transitionToResult(roomId);
              const finalRoom = await store.getRoom(roomId);
              if (finalRoom) {
                const ranking = engine.getRanking(finalRoom);
                io.to(roomId).emit("game:status-changed" as keyof ServerEvents, {
                  status: finalRoom.status,
                  questionIndex: finalRoom.currentQuestionIndex,
                  timestamp: null,
                });
                io.to(roomId).emit("room:state" as keyof ServerEvents, finalRoom);
                io.to(roomId).emit("ranking:update" as keyof ServerEvents, ranking);
              }
            }
          }
        } catch (err) {
          const code =
            err instanceof Error ? err.message : "ERRO_RESPOSTA";
          socket.emit("error", {
            message:
              code === "RESPOSTA_DUPLICADA"
                ? "Você já respondeu esta pergunta"
                : code === "TEMPO_ESGOTADO"
                  ? "Tempo esgotado"
                  : "Erro ao enviar resposta",
            code,
          });
        }
      }
    );
  });
}
