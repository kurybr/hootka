"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGlobalQuizCatalog } from "@/hooks/useGlobalQuizCatalog";
import type { PublicGlobalQuiz } from "@/types/quiz";

export default function GlobalQuizCatalogPage() {
  const { quizzes, loading, error } = useGlobalQuizCatalog();

  const officialQuizzes = quizzes.filter((q) => q.visibility === "official");
  const communityQuizzes = quizzes.filter((q) => q.visibility === "community");
  const featuredQuizzes: typeof quizzes = []; // Placeholder for future featured logic

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quizzes Globais</h1>
            <p className="text-muted-foreground">
              Descubra quizzes oficiais e comunitários para testar seus conhecimentos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/community/quizzes">Meus quizzes</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando quizzes...</p>
        ) : quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum quiz disponível no momento.
              </p>
              <Button asChild>
                <Link href="/community/quizzes/create">Criar quiz</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-10">
            {/* Quizzes em destaque - placeholder for future */}
            {featuredQuizzes.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Quizzes em destaque</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {featuredQuizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </section>
            )}

            {/* Quizzes oficiais */}
            {officialQuizzes.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Quizzes oficiais</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {officialQuizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </section>
            )}

            {/* Quizzes da comunidade */}
            {communityQuizzes.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Quizzes da comunidade</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {communityQuizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </section>
            )}

            {/* Fallback: show all if no section has items (e.g. mixed visibility) */}
            {officialQuizzes.length === 0 && communityQuizzes.length === 0 && quizzes.length > 0 && (
              <section>
                <div className="grid gap-4 lg:grid-cols-2">
                  {quizzes.map((quiz) => (
                    <QuizCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function QuizCard({ quiz }: { quiz: PublicGlobalQuiz }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{quiz.title}</span>
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {quiz.visibility === "official" ? "Oficial" : "Comunitário"}
          </span>
        </CardTitle>
        <CardDescription>
          {quiz.topic || "Sem tema"} · {quiz.questions.length} pergunta
          {quiz.questions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {quiz.description || "Sem descrição disponível."}
        </p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Tentativas: {quiz.attemptLimit === null ? "Ilimitadas" : quiz.attemptLimit}
          </span>
          <span>{quiz.questionTimeLimitMs / 1000}s por pergunta</span>
        </div>
        <Button asChild className="w-full">
          <Link href={`/quizzes/${quiz.slug}`}>Abrir quiz</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
