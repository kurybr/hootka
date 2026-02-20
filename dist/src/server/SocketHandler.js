"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandler = setupSocketHandler;
const GameEngine_1 = require("./GameEngine");
const InMemoryStore_1 = require("./InMemoryStore");
const serverMetrics_1 = require("../lib/serverMetrics");
const QUESTION_TIMEOUT_MS = 120000;
const questionTimers = new Map();
function scheduleQuestionTimeout(io, roomId, engine, store) {
    const existing = questionTimers.get(roomId);
    if (existing)
        clearTimeout(existing);
    const timeoutId = setTimeout(async () => {
        questionTimers.delete(roomId);
        try {
            const room = await store.getRoom(roomId);
            if (!room || room.status !== "playing")
                return;
            await engine.transitionToResult(roomId);
            const finalRoom = await store.getRoom(roomId);
            if (finalRoom) {
                const ranking = engine.getRanking(finalRoom);
                io.to(roomId).emit("game:status-changed", {
                    status: finalRoom.status,
                    questionIndex: finalRoom.currentQuestionIndex,
                    timestamp: null,
                });
                io.to(roomId).emit("room:state", finalRoom);
                io.to(roomId).emit("ranking:update", ranking);
            }
        }
        catch (_a) {
            // Ignore
        }
    }, QUESTION_TIMEOUT_MS);
    questionTimers.set(roomId, timeoutId);
}
function setupSocketHandler(io) {
    const store = new InMemoryStore_1.InMemoryStore();
    const engine = new GameEngine_1.GameEngine(store);
    io.on("connection", (socket) => {
        var _a, _b;
        serverMetrics_1.serverMetrics.incrementConnections();
        const hostId = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.hostId;
        const participantId = (_b = socket.handshake.auth) === null || _b === void 0 ? void 0 : _b.participantId;
        socket.on("room:rejoin", async (data) => {
            const roomId = data.roomId;
            const room = await store.getRoom(roomId);
            if (!room)
                return;
            if (hostId && room.hostId === hostId) {
                socket.join(roomId);
                socket.data.roomId = roomId;
                socket.data.role = "host";
                socket.data.hostId = hostId;
                socket.emit("room:state", room);
                return;
            }
            if (participantId && room.participants[participantId]) {
                await store.updateParticipantConnection(roomId, participantId, true);
                const updatedRoom = await store.getRoom(roomId);
                if (!updatedRoom)
                    return;
                socket.join(roomId);
                socket.data.roomId = roomId;
                socket.data.role = "participant";
                socket.data.participantId = participantId;
                socket.emit("room:state", updatedRoom);
                socket.to(roomId).emit("room:participant-reconnected", updatedRoom.participants[participantId]);
                const ranking = engine.getRanking(updatedRoom);
                io.to(roomId).emit("ranking:update", ranking);
            }
            else if (participantId || room.hostId !== hostId) {
                socket.emit("room:access-denied", {
                    reason: "Você precisa entrar na sala primeiro. Digite o código da sala.",
                });
            }
        });
        socket.on("disconnect", async () => {
            var _a;
            serverMetrics_1.serverMetrics.decrementConnections();
            const roomId = socket.data.roomId;
            const role = socket.data.role;
            const effectiveParticipantId = (_a = socket.data.participantId) !== null && _a !== void 0 ? _a : participantId;
            if (!roomId)
                return;
            if (role === "host") {
                io.to(roomId).emit("room:host-disconnected");
                return;
            }
            if (effectiveParticipantId) {
                await store.updateParticipantConnection(roomId, effectiveParticipantId, false);
                io.to(roomId).emit("room:participant-disconnected", { participantId: effectiveParticipantId });
                const updatedRoom = await store.getRoom(roomId);
                if (updatedRoom) {
                    const ranking = engine.getRanking(updatedRoom);
                    io.to(roomId).emit("ranking:update", ranking);
                }
            }
        });
        socket.on("room:create", async (data) => {
            try {
                const questions = data.questions;
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
                socket.emit("room:created", {
                    roomId: room.id,
                    code: room.code,
                });
                socket.emit("room:state", room);
            }
            catch (err) {
                socket.emit("error", {
                    message: err instanceof Error ? err.message : "Erro ao criar sala",
                    code: "ERRO_CRIAR_SALA",
                });
            }
        });
        socket.on("room:join", async (data) => {
            try {
                const { room, participant } = await engine.joinRoom(data.code, data.name);
                socket.join(room.id);
                socket.data.roomId = room.id;
                socket.data.role = "participant";
                socket.data.participantId = participant.id;
                socket.emit("room:joined", {
                    participantId: participant.id,
                    roomId: room.id,
                });
                socket.emit("room:state", room);
                socket.to(room.id).emit("room:participant-joined", participant);
                const ranking = engine.getRanking(room);
                io.to(room.id).emit("ranking:update", ranking);
            }
            catch (err) {
                const code = err instanceof Error ? err.message : "ERRO_ENTRAR_SALA";
                socket.emit("error", {
                    message: code === "SALA_NAO_ENCONTRADA"
                        ? "Sala não encontrada"
                        : code === "SALA_JA_INICIADA"
                            ? "Esta sala já está em andamento"
                            : code === "NOME_DUPLICADO"
                                ? "Nome já utilizado nesta sala"
                                : "Erro ao entrar na sala",
                    code,
                });
            }
        });
        socket.on("game:start", async () => {
            var _a;
            const roomId = socket.data.roomId;
            const effectiveHostId = (_a = socket.data.hostId) !== null && _a !== void 0 ? _a : hostId;
            if (!roomId || !effectiveHostId)
                return;
            try {
                const room = await engine.startGame(roomId, effectiveHostId);
                const { count, total } = engine.getAnswerCount(room, room.currentQuestionIndex);
                const ranking = engine.getRanking(room);
                socket.emit("game:status-changed", {
                    status: room.status,
                    questionIndex: room.currentQuestionIndex,
                    timestamp: room.questionStartTimestamp,
                });
                socket.emit("room:state", room);
                io.to(roomId).emit("game:status-changed", {
                    status: room.status,
                    questionIndex: room.currentQuestionIndex,
                    timestamp: room.questionStartTimestamp,
                });
                io.to(roomId).emit("room:state", room);
                io.to(roomId).emit("game:answer-count", {
                    count,
                    total,
                });
                io.to(roomId).emit("ranking:update", ranking);
                scheduleQuestionTimeout(io, roomId, engine, store);
            }
            catch (err) {
                socket.emit("error", {
                    message: err instanceof Error ? err.message : "Erro ao iniciar jogo",
                    code: "ERRO_INICIAR",
                });
            }
        });
        socket.on("game:force-result", async () => {
            var _a;
            const roomId = socket.data.roomId;
            const effectiveHostId = (_a = socket.data.hostId) !== null && _a !== void 0 ? _a : hostId;
            if (!roomId || !effectiveHostId)
                return;
            try {
                const existingTimer = questionTimers.get(roomId);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                    questionTimers.delete(roomId);
                }
                const room = await engine.forceResult(roomId, effectiveHostId);
                const ranking = engine.getRanking(room);
                io.to(roomId).emit("game:status-changed", {
                    status: room.status,
                    questionIndex: room.currentQuestionIndex,
                    timestamp: null,
                });
                io.to(roomId).emit("room:state", room);
                io.to(roomId).emit("ranking:update", ranking);
            }
            catch (err) {
                socket.emit("error", {
                    message: err instanceof Error
                        ? err.message
                        : "Erro ao encerrar pergunta",
                    code: "ERRO_ENCERRAR_PERGUNTA",
                });
            }
        });
        socket.on("game:next-question", async () => {
            var _a;
            const roomId = socket.data.roomId;
            const effectiveHostId = (_a = socket.data.hostId) !== null && _a !== void 0 ? _a : hostId;
            if (!roomId || !effectiveHostId)
                return;
            try {
                const room = await engine.nextQuestion(roomId, effectiveHostId);
                const { count, total } = engine.getAnswerCount(room, room.currentQuestionIndex);
                io.to(roomId).emit("game:status-changed", {
                    status: room.status,
                    questionIndex: room.currentQuestionIndex,
                    timestamp: room.questionStartTimestamp,
                });
                io.to(roomId).emit("room:state", room);
                io.to(roomId).emit("game:answer-count", {
                    count,
                    total,
                });
                scheduleQuestionTimeout(io, roomId, engine, store);
            }
            catch (err) {
                socket.emit("error", {
                    message: err instanceof Error ? err.message : "Erro ao avançar pergunta",
                    code: "ERRO_AVANCAR",
                });
            }
        });
        socket.on("game:end", async () => {
            var _a;
            const roomId = socket.data.roomId;
            const effectiveHostId = (_a = socket.data.hostId) !== null && _a !== void 0 ? _a : hostId;
            if (!roomId || !effectiveHostId)
                return;
            try {
                const room = await engine.endGame(roomId, effectiveHostId);
                io.to(roomId).emit("game:status-changed", {
                    status: room.status,
                    questionIndex: room.currentQuestionIndex,
                    timestamp: null,
                });
                io.to(roomId).emit("room:state", room);
            }
            catch (err) {
                socket.emit("error", {
                    message: err instanceof Error ? err.message : "Erro ao encerrar jogo",
                    code: "ERRO_ENCERRAR",
                });
            }
        });
        socket.on("answer:submit", async (data) => {
            var _a;
            const roomId = socket.data.roomId;
            const effectiveParticipantId = (_a = socket.data.participantId) !== null && _a !== void 0 ? _a : participantId;
            if (!roomId || !effectiveParticipantId)
                return;
            const room = await store.getRoom(roomId);
            if (!room)
                return;
            const questionIndex = room.currentQuestionIndex;
            try {
                const result = await engine.submitAnswer(roomId, effectiveParticipantId, questionIndex, data.optionIndex);
                serverMetrics_1.serverMetrics.incrementAnswersProcessed();
                socket.emit("answer:result", {
                    correct: result.correct,
                    score: result.score,
                    correctIndex: result.correctIndex,
                });
                const updatedRoom = await store.getRoom(roomId);
                if (updatedRoom) {
                    const { count, total } = engine.getAnswerCount(updatedRoom, questionIndex);
                    io.to(roomId).emit("game:answer-count", {
                        count,
                        total,
                    });
                    const ranking = engine.getRanking(updatedRoom);
                    io.to(roomId).emit("ranking:update", ranking);
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
                            io.to(roomId).emit("game:status-changed", {
                                status: finalRoom.status,
                                questionIndex: finalRoom.currentQuestionIndex,
                                timestamp: null,
                            });
                            io.to(roomId).emit("room:state", finalRoom);
                            io.to(roomId).emit("ranking:update", ranking);
                        }
                    }
                }
            }
            catch (err) {
                const code = err instanceof Error ? err.message : "ERRO_RESPOSTA";
                socket.emit("error", {
                    message: code === "RESPOSTA_DUPLICADA"
                        ? "Você já respondeu esta pergunta"
                        : code === "TEMPO_ESGOTADO"
                            ? "Tempo esgotado"
                            : "Erro ao enviar resposta",
                    code,
                });
            }
        });
    });
}
