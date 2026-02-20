"use client";

import { Loader2 } from "lucide-react";
import { useConnectionState } from "@/hooks/useConnectionState";

export function ReconnectingOverlay() {
  const { showReconnectingOverlay } = useConnectionState();

  if (!showReconnectingOverlay) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Reconectando...</p>
        <p className="text-sm text-muted-foreground">
          Aguarde enquanto restauramos sua conexão.
        </p>
      </div>
    </div>
  );
}
