import { GameEngine } from "@/server/GameEngine";
import { FirebaseStore } from "@/server/FirebaseStore";
import { getFirebaseAdminDatabase } from "./firebaseAdmin";

let engine: GameEngine | null = null;

export function getFirebaseEngine(): GameEngine | null {
  if (engine) return engine;
  if (!getFirebaseAdminDatabase()) return null;
  try {
    const store = new FirebaseStore();
    engine = new GameEngine(store);
    return engine;
  } catch {
    return null;
  }
}
