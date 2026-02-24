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
import { useRealTime } from "@/providers/RealTimeContext";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { trackEvent } from "@/lib/gtag";
import type { Question } from "@/types/quiz";

const EMPTY_QUESTION: Question = {
  text: "",
  options: ["", "", "", ""],
  correctOptionIndex: 0,
};

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const provider = useRealTime();
  const { saveQuiz: libSaveQuiz, quizzes } = useQuizLibrary();
  const [questions, setQuestions] = useState<Question[]>([{ ...EMPTY_QUESTION }]);
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
            ? quiz.questions.map((q) => ({ ...q, options: [...q.options] }))
            : [{ ...EMPTY_QUESTION }]
        );
        setQuizTitle(quiz.title);
      }
    }
  }, [quizId, quizzes]);

  const addQuestion = () => {
    setQuestions((q) => [...q, { ...EMPTY_QUESTION }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((q) => q.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    setQuestions((q) => {
      const copy = [...q];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: unknown) => {
    setQuestions((q) => {
      const copy = [...q];
      const question = { ...copy[index] };
      if (field === "text") question.text = value as string;
      if (field === "options") question.options = value as [string, string, string, string];
      if (field === "correctOptionIndex") question.correctOptionIndex = value as number;
      copy[index] = question;
      return copy;
    });
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((q) => {
      const copy = [...q];
      const options = [...copy[qIndex].options] as [string, string, string, string];
      options[optIndex] = value;
      copy[qIndex] = { ...copy[qIndex], options };
      return copy;
    });
  };

  const validateQuestions = (): string | null => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Pergunta ${i + 1}: enunciado é obrigatório`;
      const filled = q.options.filter((o) => o.trim()).length;
      if (filled !== 4) return `Pergunta ${i + 1}: são necessárias exatamente 4 alternativas`;
      if (q.correctOptionIndex < 0 || q.correctOptionIndex > 3)
        return `Pergunta ${i + 1}: selecione a alternativa correta`;
      if (!q.options[q.correctOptionIndex]?.trim())
        return `Pergunta ${i + 1}: a alternativa correta não pode estar vazia`;
    }
    return null;
  };

  const handleCreate = async () => {
    setError(null);
    const err = validateQuestions();
    if (err) {
      setError(err);
      return;
    }

    const validQuestions: Question[] = questions.map((q) => ({
      text: q.text.trim(),
      options: q.options.map((o) => o.trim()) as [string, string, string, string],
      correctOptionIndex: q.correctOptionIndex,
    }));

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
          Adicione as perguntas do quiz. Cada pergunta deve ter exatamente 4
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

        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <Card key={qIndex}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg">
                  Pergunta {qIndex + 1}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveQuestion(qIndex, "up")}
                    disabled={qIndex === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => moveQuestion(qIndex, "down")}
                    disabled={qIndex === questions.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length <= 1}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Enunciado
                  </label>
                  <Input
                    placeholder="Digite a pergunta..."
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(qIndex, "text", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Alternativas (selecione a correta)
                  </label>
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={q.correctOptionIndex === optIndex}
                        onChange={() =>
                          updateQuestion(qIndex, "correctOptionIndex", optIndex)
                        }
                      />
                      <Input
                        placeholder={`Alternativa ${optIndex + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(qIndex, optIndex, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button variant="outline" onClick={addQuestion} className="flex-1">
            + Adicionar Pergunta
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1"
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
