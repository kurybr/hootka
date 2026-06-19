"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GoogleSignInCard } from "@/components/GoogleSignInCard";
import { GlobalQuizForm } from "@/components/GlobalQuizForm";
import { getGlobalQuizById, updateGlobalQuiz } from "@/lib/globalQuizClient";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import type { GlobalQuiz } from "@/types/quiz";

export default function EditCommunityQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const isCreator = Boolean(user && !user.isAnonymous);
  const [quiz, setQuiz] = useState<GlobalQuiz | null>(null);
  const [loading, setLoading] = useState(Boolean(isCreator));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCreator) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getGlobalQuizById(quizId);
        if (!cancelled) {
          setQuiz(data.quiz);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar desafio");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [quizId, isCreator]);

  if (!user || !isCreator) {
    return (
      <main className="min-h-screen p-8 lg:p-12">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <Button variant="outline" asChild>
            <Link href="/community/quizzes">Voltar</Link>
          </Button>
          <GoogleSignInCard
            title="Entre com Google para editar seu desafio"
            description="A edição de desafios públicos exige uma conta Google com e-mail verificado."
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar desafio</h1>
            <p className="text-muted-foreground">
              Ajuste perguntas, tentativas e publicação do seu desafio.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/community/quizzes/${quizId}`}>Voltar</Link>
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading || !quiz ? (
          <p className="text-sm text-muted-foreground">Carregando desafio...</p>
        ) : (
          <GlobalQuizForm
            initialValues={quiz}
            loading={saving}
            isAdmin={profile?.role === "admin"}
            submitLabel="Salvar alterações"
            onSubmit={async (values) => {
              setSaving(true);
              try {
                const { quiz: updated } = await updateGlobalQuiz(quiz.id, values);
                setQuiz(updated);
                toast({
                  title: "Desafio atualizado",
                  description: "As alterações foram salvas.",
                });
                router.push(`/community/quizzes/${quiz.id}`);
              } finally {
                setSaving(false);
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
