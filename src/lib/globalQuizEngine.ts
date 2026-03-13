import { GlobalQuizEngine } from "@/server/GlobalQuizEngine";

let globalQuizEngine: GlobalQuizEngine | null = null;

export function getGlobalQuizEngine() {
  if (!globalQuizEngine) {
    globalQuizEngine = new GlobalQuizEngine();
  }
  return globalQuizEngine;
}
