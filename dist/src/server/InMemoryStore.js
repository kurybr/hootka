"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStore = void 0;
class InMemoryStore {
    constructor() {
        this.rooms = new Map();
    }
    async createRoom(room) {
        this.rooms.set(room.id, Object.assign({}, room));
    }
    async getRoom(roomId) {
        var _a;
        return (_a = this.rooms.get(roomId)) !== null && _a !== void 0 ? _a : null;
    }
    async getRoomByCode(code) {
        const normalizedCode = code.toUpperCase().trim();
        for (const room of this.rooms.values()) {
            if (room.code === normalizedCode)
                return room;
        }
        return null;
    }
    async updateRoom(roomId, updates) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        Object.assign(room, updates);
    }
    async addParticipant(roomId, participant) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        room.participants[participant.id] = Object.assign({}, participant);
    }
    async updateParticipantConnection(roomId, participantId, connected) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const participant = room.participants[participantId];
        if (!participant)
            return;
        participant.connected = connected;
    }
    async addAnswer(roomId, questionIndex, answer) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const qKey = String(questionIndex);
        if (!room.answers[qKey]) {
            room.answers[qKey] = {};
        }
        room.answers[qKey][answer.participantId] = Object.assign({}, answer);
    }
    async updateParticipantScore(roomId, participantId, scoreIncrement, responseTime) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const participant = room.participants[participantId];
        if (!participant)
            return;
        participant.totalScore += scoreIncrement;
        participant.totalResponseTime += responseTime;
        participant.questionsAnswered += 1;
    }
    async deleteRoom(roomId) {
        this.rooms.delete(roomId);
    }
}
exports.InMemoryStore = InMemoryStore;
