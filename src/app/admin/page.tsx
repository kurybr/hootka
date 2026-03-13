"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { authFetch } from "@/lib/authFetch";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [clearing, setClearing] = useState(false);

  if (authLoading) {
    return (
      <main className="min-h-screen p-8 lg:p-12">
        <div className="mx-auto w-full max-w-2xl">Carregando...</div>
      </main>
    );
  }

  if (!user) {
    router.replace("/");
    return null;
  }

  if (profile?.role !== "admin") {
    return (
      <main className="min-h-screen p-8 lg:p-12">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          <p className="text-destructive">Acesso negado. Apenas administradores.</p>
          <Button variant="outline" asChild>
            <Link href="/">Voltar</Link>
          </Button>
        </div>
      </main>
    );
  }

  const handleClearDatabase = async () => {
    const msg =
      "Isso vai apagar TODOS os dados do banco (salas, usuários, quizzes globais, tentativas, ranking). Não há como desfazer. Continuar?";
    if (!window.confirm(msg)) return;

    setClearing(true);
    try {
      const res = await authFetch("/api/admin/clear-database", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Erro",
          description: data?.error ?? "Falha ao limpar o banco.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Banco limpo",
        description: `Paths removidos: ${(data.cleared ?? []).join(", ")}`,
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao limpar o banco.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin</h1>
          <Button variant="outline" asChild>
            <Link href="/">Voltar</Link>
          </Button>
        </div>

        <section className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <h2 className="mb-2 font-semibold text-destructive">Zona de risco</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Limpar o banco remove todos os dados: salas de jogo, perfis de usuário, quizzes
            globais, tentativas e ranking. Use apenas se tiver certeza.
          </p>
          <Button
            variant="destructive"
            disabled={clearing}
            onClick={handleClearDatabase}
          >
            {clearing ? "Limpando…" : "Limpar todo o banco de dados"}
          </Button>
        </section>
      </div>
    </main>
  );
}
