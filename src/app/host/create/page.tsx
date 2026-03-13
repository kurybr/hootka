"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuestionListEditor } from "@/components/QuestionListEditor";
import {
  cloneQuestions,
  createEmptyQuestion,
  trimQuestion,
  validateQuestions,
} from "@/lib/questionUtils";
import { useRealTime } from "@/providers/RealTimeContext";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { trackEvent } from "@/lib/gtag";
import type { Question } from "@/types/quiz";

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = useRealTime();
  const { saveQuiz: libSaveQuiz, quizzes } = useQuizLibrary();
  const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion()]);
  const [quizTitle, setQuizTitle] = useState("");
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quizId = searchParams.get("quizId");

  useEffect(() => {
    if (quizId) {
      const quiz = quizzes.find((q) => q.id === quizId);
      if (quiz) {
        setQuestions(
          quiz.questions.length > 0
            ? cloneQuestions(quiz.questions)
            : [createEmptyQuestion()]
        );
        setQuizTitle(quiz.title);
      }
    }
  }, [quizId, quizzes]);

  const handleCreate = async () => {
    setError(null);
    const err = validateQuestions(questions);
    if (err) {
      setError(err);
      return;
    }

    const validQuestions: Question[] = questions.map(trimQuestion);

    setLoading(true);
    try {
      if (saveToLibrary) {
        const title = quizTitle.trim() || "Quiz sem título";
        await libSaveQuiz({ title, questions: validQuestions });
        toast({
          title: "Quiz salvo na biblioteca",
          description: `"${title}" foi adicionado.`,
        });
      }

      const { roomId } = await provider.createRoom(validQuestions);
      trackEvent("room_created", { room_id: roomId });
      toast({
        title: "Sala criada!",
        description: "Redirecionando...",
      });
      router.push(`/host/${roomId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar sala";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Erro ao criar sala",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Criar Sala</h1>
          <Button variant="outline" asChild>
            <Link href="/host">Voltar</Link>
          </Button>
        </div>

        <p className="text-muted-foreground">
          Adicione as perguntas do quiz. Cada pergunta pode ter entre 2 e 5
          alternativas e uma resposta correta.
        </p>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Salvar na biblioteca</CardTitle>
            <CardDescription>
              Marque para reutilizar este quiz depois sem recriar as perguntas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
              />
              <span className="text-sm font-medium">
                Salvar quiz na biblioteca ao criar sala
              </span>
            </label>
            {saveToLibrary && (
              <div>
                <label htmlFor="quiz-title" className="mb-1 block text-sm font-medium">
                  Título do quiz
                </label>
                <Input
                  id="quiz-title"
                  placeholder="Ex: Conhecimentos Gerais"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <QuestionListEditor questions={questions} onChange={setQuestions} />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 sm:ml-auto"
          >
            {loading ? "Criando..." : "Criar Sala"}
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-8">Carregando...</div>}>
      <CreateRoomContent />
    </Suspense>
  );
}
