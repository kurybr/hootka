"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignInCard } from "@/components/GoogleSignInCard";
import { useMyGlobalQuizzes } from "@/hooks/useMyGlobalQuizzes";
import { useAuth } from "@/providers/AuthProvider";

export default function CommunityQuizzesPage() {
  const { user, profile } = useAuth();
  const isCreator = Boolean(user && !user.isAnonymous);
  const { quizzes, loading, error } = useMyGlobalQuizzes(isCreator);

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meus desafios</h1>
            <p className="text-muted-foreground max-w-xl">
              Entre com <strong>Google</strong> para publicar desafios comunitários. Jogadores usam só
              um nome no catálogo — sem fila de e-mail.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/quizzes">Explorar</Link>
            </Button>
            {user && !user.isAnonymous && (
              <Button asChild>
                <Link href="/community/quizzes/create">Novo desafio</Link>
              </Button>
            )}
          </div>
        </div>

        {!isCreator ? (
          <GoogleSignInCard
            title="Entre com Google para criar desafios"
            description="Publique desafios comunitários, salve na nuvem e gerencie tentativas. Jogadores podem usar só um nome no catálogo."
          />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{profile?.username || user?.email}</CardTitle>
                <CardDescription>
                  Seus desafios ficam salvos na nuvem e podem aparecer no catálogo global.
                </CardDescription>
              </CardHeader>
            </Card>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando seus desafios...</p>
            ) : quizzes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-muted-foreground mb-4">
                    Você ainda não criou nenhum desafio.
                  </p>
                  <Button asChild>
                    <Link href="/community/quizzes/create">Criar desafio</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <CardTitle>{quiz.title}</CardTitle>
                      <CardDescription>
                        {quiz.status === "published" ? "Publicado" : "Rascunho"} ·{" "}
                        {quiz.questions.length} perguntas
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {quiz.description || "Sem descrição disponível."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" asChild>
                          <Link href={`/community/quizzes/${quiz.id}`}>Detalhes</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/community/quizzes/${quiz.id}/edit`}>Editar</Link>
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                          <Link href={`/quizzes/${quiz.slug}`}>Jogar público</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
