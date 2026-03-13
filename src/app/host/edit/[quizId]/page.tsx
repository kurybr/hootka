"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const provider = useRealTime();
  const { quizzes, loading: quizzesLoading, updateQuiz: libUpdateQuiz } = useQuizLibrary();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([createEmptyQuestion()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (quizzesLoading || initialized) return;
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) {
      if (quizzes.length > 0) router.replace("/host");
      return;
    }
    setTitle(quiz.title);
    setQuestions(
      quiz.questions.length > 0
        ? cloneQuestions(quiz.questions)
        : [createEmptyQuestion()]
    );
    setInitialized(true);
  }, [quizId, quizzes, quizzesLoading, router, initialized]);

  const handleSave = async () => {
    setError(null);
    const err = validateQuestions(questions);
    if (err) {
      setError(err);
      return;
    }

    if (!title.trim()) {
      setError("Informe um título para o quiz");
      return;
    }

    const validQuestions: Question[] = questions.map(trimQuestion);

    setSaving(true);
    try {
      await libUpdateQuiz(quizId, { title: title.trim(), questions: validQuestions });
      toast({
        title: "Alterações salvas",
        description: "O quiz foi atualizado na biblioteca.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartRoom = async () => {
    setError(null);
    const err = validateQuestions(questions);
    if (err) {
      setError(err);
      return;
    }

    const validQuestions: Question[] = questions.map(trimQuestion);

    setLoading(true);
    try {
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
          <h1 className="text-2xl font-bold">Editar Quiz</h1>
          <Button variant="outline" asChild>
            <Link href="/host">Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Título do quiz</CardTitle>
            <CardDescription>
              Nome exibido na biblioteca de quizzes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Ex: Conhecimentos Gerais"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </CardContent>
        </Card>

        <p className="text-muted-foreground">
          Edite as perguntas do quiz. Cada pergunta pode ter entre 2 e 5
          alternativas e uma resposta correta.
        </p>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <QuestionListEditor questions={questions} onChange={setQuestions} />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button
            onClick={handleStartRoom}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Criando..." : "Iniciar Sala com este Quiz"}
          </Button>
        </div>
      </div>
    </main>
  );
}
