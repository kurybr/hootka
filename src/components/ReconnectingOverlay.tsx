"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConnectionState } from "@/hooks/useConnectionState";

const SHOW_RETRY_AFTER_MS = 8000;

export function ReconnectingOverlay() {
  const { showReconnectingOverlay, connected } = useConnectionState();
  const [disconnectedAt, setDisconnectedAt] = useState<number | null>(null);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (showReconnectingOverlay && !connected) {
      if (disconnectedAt === null) setDisconnectedAt(Date.now());
    } else {
      setDisconnectedAt(null);
      setShowRetry(false);
    }
  }, [showReconnectingOverlay, connected, disconnectedAt]);

  useEffect(() => {
    if (disconnectedAt === null) return;
    const t = setTimeout(() => setShowRetry(true), SHOW_RETRY_AFTER_MS);
    return () => clearTimeout(t);
  }, [disconnectedAt]);

  if (!showReconnectingOverlay) return null;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      aria-live="polite"
      aria-busy={!showRetry}
    >
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg">
        {showRetry ? (
          <>
            <p className="text-lg font-medium">Servidor indisponível</p>
            <p className="text-center text-sm text-muted-foreground">
              Não foi possível conectar. Verifique sua internet e tente
              novamente.
            </p>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Reconectando...</p>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto restauramos sua conexão.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
