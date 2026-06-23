"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { isShadowLoginEnabledClient } from "@/lib/shadowLogin";

export function ShadowModeBanner() {
  const router = useRouter();
  const { isShadowSession, shadowSession, exitShadowSession } = useAuth();

  if (!isShadowLoginEnabledClient() || !isShadowSession || !shadowSession) {
    return null;
  }

  const handleExit = async () => {
    await exitShadowSession();
    router.replace("/");
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-700/40 bg-amber-100 px-4 py-2 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/80 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Modo investigação:{" "}
          <span className="font-semibold">{shadowSession.email}</span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-amber-800/30 bg-white/80 text-amber-950 hover:bg-white dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-50 dark:hover:bg-amber-900"
          onClick={() => void handleExit()}
        >
          Sair do shadow
        </Button>
      </div>
    </div>
  );
}
