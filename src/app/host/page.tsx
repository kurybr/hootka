"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Pencil,
  Copy,
  Trash2,
  Plus,
  FileQuestion,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getQuizzes, deleteQuiz, duplicateQuiz } from "@/lib/quizStorage";
import type { SavedQuiz } from "@/types/quiz";
import { useRealTime } from "@/providers/RealTimeContext";
import { trackEvent } from "@/lib/gtag";
import { toast } from "@/hooks/use-toast";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HostDashboardPage() {
  const router = useRouter();
  const provider = useRealTime();
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SavedQuiz | null>(null);
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);

  useEffect(() => {
    setQuizzes(getQuizzes());
  }, []);

  const [sortBy, setSortBy] = useState<"recent" | "title">("recent");
  const sortedQuizzes = useMemo(() => {
    const list = [...quizzes];
    if (sortBy === "recent") {
      list.sort((a, b) => b.updatedAt - a.updatedAt);
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [quizzes, sortBy]);

  const handleStartRoom = async (quiz: SavedQuiz) => {
    if (quiz.questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Quiz vazio",
        description: "Adicione pelo menos uma pergunta antes de iniciar.",
      });
      return;
    }

    const validQuestions = quiz.questions.filter(
      (q) =>
        q.text.trim() &&
        q.options.every((o) => o.trim()) &&
        q.options[q.correctOptionIndex]?.trim()
    );

    if (validQuestions.length === 0) {
      toast({
        variant: "destructive",
        title: "Quiz inválido",
        description: "Adicione perguntas válidas antes de iniciar.",
      });
      return;
    }

    setStartingQuizId(quiz.id);
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: msg,
      });
    } finally {
      setStartingQuizId(null);
    }
  };

  const handleDuplicate = (quiz: SavedQuiz) => {
    try {
      duplicateQuiz(quiz.id);
      setQuizzes(getQuizzes());
      toast({
        title: "Quiz duplicado",
        description: `"Cópia de ${quiz.title}" foi criado.`,
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível duplicar o quiz.",
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteQuiz(deleteTarget.id);
    setQuizzes(getQuizzes());
    setDeleteTarget(null);
    toast({
      title: "Quiz excluído",
      description: `"${deleteTarget.title}" foi removido.`,
    });
  };

  return (
    <main className="min-h-screen p-8 lg:p-12">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Biblioteca de Quizzes</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/">Voltar</Link>
            </Button>
            <Button asChild>
              <Link href="/host/create">
                <Plus className="mr-2 h-4 w-4" />
                Criar Novo Quiz
              </Link>
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground">
          Gerencie seus quizzes e inicie salas com apenas um clique.
        </p>

        {quizzes.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
            >
              Mais recentes
            </Button>
            <Button
              variant={sortBy === "title" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("title")}
            >
              Por título
            </Button>
          </div>
        )}

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Nenhum quiz salvo ainda
              </h3>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Crie seu primeiro quiz e salve-o na biblioteca para reutilizar
                quantas vezes quiser.
              </p>
              <Button asChild size="lg">
                <Link href="/host/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Novo Quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <CardDescription>
                      {quiz.questions.length} pergunta
                      {quiz.questions.length !== 1 ? "s" : ""} · Atualizado em{" "}
                      {formatDate(quiz.updatedAt)}
                    </CardDescription>
                    {quiz.questions.length > 0 && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {quiz.questions.slice(0, 2).map((q) => q.text).join(" • ")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStartRoom(quiz)}
                      disabled={startingQuizId !== null}
                    >
                      <Play className="mr-1 h-4 w-4" />
                      Iniciar Sala
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/host/edit/${quiz.id}`}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(quiz)}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Duplicar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(quiz)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </CardHeader>
              </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir quiz</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir &quot;{deleteTarget?.title}&quot;?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
