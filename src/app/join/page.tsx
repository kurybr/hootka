"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRealTime } from "@/providers/RealTimeContext";

export default function JoinPage() {
  const router = useRouter();
  const provider = useRealTime();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      setError("Informe o código da sala");
      return;
    }
    if (trimmedCode.length !== 6) {
      setError("O código deve ter 6 caracteres");
      return;
    }
    if (!trimmedName) {
      setError("Informe seu nome");
      return;
    }

    setLoading(true);
    try {
      const { roomId } = await provider.joinRoom(trimmedCode, trimmedName);
      router.push(`/play/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar na sala");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Entrar em Sala</h1>
          <Button variant="outline" asChild>
            <Link href="/">Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Digite o código da sala</CardTitle>
            <CardDescription>
              O host deve compartilhar o código de 6 caracteres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium">
                  Código da sala
                </label>
                <Input
                  id="code"
                  placeholder="Ex: ABC123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono text-lg tracking-widest uppercase"
                />
              </div>
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium">
                  Seu nome
                </label>
                <Input
                  id="name"
                  placeholder="Como deseja ser chamado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
