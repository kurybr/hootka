"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { SocketIOProvider } from "./SocketIOProvider";
import { FirebaseProvider } from "./FirebaseProvider";
import type { IRealTimeProvider } from "./IRealTimeProvider";

const RealTimeContext = createContext<IRealTimeProvider | null>(null);

const PROVIDER = process.env.NEXT_PUBLIC_PROVIDER || "websocket";

export function RealTimeProvider({ children }: { children: ReactNode }) {
  const providerRef = useRef<IRealTimeProvider | null>(null);

  const provider = useMemo(() => {
    if (providerRef.current) return providerRef.current;
    providerRef.current =
      PROVIDER === "firebase" ? new FirebaseProvider() : new SocketIOProvider();
    return providerRef.current;
  }, []);

  return (
    <RealTimeContext.Provider value={provider}>{children}</RealTimeContext.Provider>
  );
}

export function useRealTime(): IRealTimeProvider {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error("useRealTime deve ser usado dentro de RealTimeProvider");
  }
  return context;
}
