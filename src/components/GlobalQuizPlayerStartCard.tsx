"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { isValidPlayerDisplayName, PLAYER_DISPLAY_NAME_MAX } from "@/lib/playerIdentity";

interface GlobalQuizPlayerStartCardProps {
  /** Opcional: ex. navegar após salvar o nome. */
  onReadyToPlay?: () => void | Promise<void>;
  submitLabel?: string;
}

/**
 * Identificação leve para o quiz global: sessão anômima (se necessário) + nome no ranking.
 */
export function GlobalQuizPlayerStartCard({
  onReadyToPlay,
  submitLabel = "Iniciar tentativa",
}: GlobalQuizPlayerStartCardProps) {
  const {
    user,
    profile,
    loading,
    signInAnonymouslyForPlay,
    setPlayerDisplayName,
  } = useAuth();
  const [name, setName] = useState(profile?.username ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.username) {
      setName(profile.username);
    }
  }, [profile?.username]);

  const handleSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!user) {
        await signInAnonymouslyForPlay();
      }
      const chosen = name.trim();
      if (!isValidPlayerDisplayName(chosen)) {
        setError(`Informe um nome de 2 a ${PLAYER_DISPLAY_NAME_MAX} caracteres.`);
        setBusy(false);
        return;
      }
      await setPlayerDisplayName(chosen);
      await onReadyToPlay?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participar do ranking</CardTitle>
        <CardDescription>
          Escolha como quer aparecer no ranking. Não enviamos e-mail — apenas uma sessão segura
          neste dispositivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="global-player-name" className="text-sm font-medium">
            Seu nome no ranking
          </label>
          <Input
            id="global-player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Maria"
            maxLength={PLAYER_DISPLAY_NAME_MAX}
            disabled={loading || busy}
            autoComplete="nickname"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={loading || busy}
          onClick={() => void handleSubmit()}
        >
          {busy ? "Preparando..." : submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
