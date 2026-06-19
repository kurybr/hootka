"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatRoomCodeDisplay,
  normalizeRoomCode,
  validateRoomCode,
} from "@/lib/joinRoomForm";

export function HomeJoinCard() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateRoomCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    const normalized = normalizeRoomCode(code);
    router.push(`/join?code=${encodeURIComponent(normalized)}`);
  };

  return (
    <Card className="border-border/80 text-left shadow-sm">
      <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
        <CardTitle className="font-sans text-base font-medium">
          Entrar em uma sala
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="home-room-code" className="sr-only">
              Código da sala
            </label>
            <Input
              id="home-room-code"
              placeholder="Código da sala"
              value={formatRoomCodeDisplay(code)}
              onChange={(event) => {
                setCode(
                  event.target.value.replace(/\s/g, "").toUpperCase().slice(0, 6)
                );
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === " ") event.preventDefault();
              }}
              maxLength={11}
              autoComplete="off"
              spellCheck={false}
              className="font-mono tracking-[0.2em] uppercase sm:flex-1"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "home-room-code-error" : undefined}
            />
            <Button type="submit" className="shrink-0 sm:min-w-[6.5rem]">
              Entrar
            </Button>
          </div>
          {error && (
            <p
              id="home-room-code-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
