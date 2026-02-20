"use strict";
/**
 * Métricas do servidor para testes de carga.
 * Coletadas durante os testes para identificar gargalos.
 * Apenas ativo em dev/test (NODE_ENV !== "production" ou ENABLE_METRICS=1).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverMetrics = void 0;
let activeConnections = 0;
let answersProcessed = 0;
let answersProcessedLastSecond = 0;
let lastAnswersReset = Date.now();
const answersPerSecondHistory = [];
const MAX_HISTORY = 60;
function maybeResetAnswersPerSecond() {
    const now = Date.now();
    if (now - lastAnswersReset >= 1000) {
        answersPerSecondHistory.push(answersProcessedLastSecond);
        if (answersPerSecondHistory.length > MAX_HISTORY) {
            answersPerSecondHistory.shift();
        }
        answersProcessedLastSecond = 0;
        lastAnswersReset = now;
    }
}
exports.serverMetrics = {
    incrementConnections() {
        activeConnections++;
    },
    decrementConnections() {
        activeConnections = Math.max(0, activeConnections - 1);
    },
    incrementAnswersProcessed() {
        answersProcessed++;
        answersProcessedLastSecond++;
        maybeResetAnswersPerSecond();
    },
    getSnapshot() {
        maybeResetAnswersPerSecond();
        const mem = process.memoryUsage();
        const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
        const rssMB = Math.round(mem.rss / 1024 / 1024);
        const answersPerSecond = answersPerSecondHistory.length > 0
            ? answersPerSecondHistory[answersPerSecondHistory.length - 1]
            : 0;
        return {
            activeConnections,
            answersProcessedTotal: answersProcessed,
            answersProcessedLastSecond: answersPerSecond,
            memory: {
                heapUsedMB,
                rssMB,
                externalMB: Math.round((mem.external || 0) / 1024 / 1024),
            },
            uptimeSeconds: Math.floor(process.uptime()),
            timestamp: Date.now(),
        };
    },
    reset() {
        activeConnections = 0;
        answersProcessed = 0;
        answersProcessedLastSecond = 0;
        answersPerSecondHistory.length = 0;
        lastAnswersReset = Date.now();
    },
};
