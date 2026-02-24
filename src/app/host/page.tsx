/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Pencil,
  Copy,
  Trash2,
  Plus,
  FileQuestion,
  Download,
  Upload,
  Cloud,
  LogOut,
  LogIn,
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
import {
  exportQuizToFile,
  exportMultipleQuizzes,
  parseImportFile,
} from "@/lib/quizExportImport";
import type { SavedQuiz, ExportedQuiz } from "@/types/quiz";
import { useQuizLibrary } from "@/hooks/useQuizLibrary";
import { useAuth } from "@/providers/AuthProvider";
import { useRealTime } from "@/providers/RealTimeContext";
import { trackEvent } from "@/lib/gtag";
import { AdSense } from "@/components/AdSense";
import { toast } from "@/hooks/use-toast";
import { ImportQuizDialog } from "@/components/ImportQuizDialog";
import { cn } from "@/lib/utils";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    quizzes,
    loading: libraryLoading,
    saveQuiz: libSaveQuiz,
    deleteQuiz: libDeleteQuiz,
    duplicateQuiz: libDuplicateQuiz,
    refresh,
  } = useQuizLibrary();
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<SavedQuiz | null>(null);
  const [startingQuizId, setStartingQuizId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importDialogData, setImportDialogData] = useState<ExportedQuiz[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDuplicate = async (quiz: SavedQuiz) => {
    try {
      await libDuplicateQuiz(quiz.id);
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await libDeleteQuiz(deleteTarget.id);
    const title = deleteTarget.title;
    setDeleteTarget(null);
    toast({
      title: "Quiz excluído",
      description: `"${title}" foi removido.`,
    });
  };

  const handleExport = (quiz: SavedQuiz) => {
    exportQuizToFile(quiz);
    toast({
      title: "Quiz exportado",
      description: `"${quiz.title}" foi baixado.`,
    });
  };

  const handleExportSelected = () => {
    const toExport = quizzes.filter((q) => selectedIds.has(q.id));
    if (toExport.length === 0) return;
    exportMultipleQuizzes(toExport);
    setSelectedIds(new Set());
    toast({
      title: "Quizzes exportados",
      description: `${toExport.length} quiz(zes) foram baixados.`,
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const processImportFile = async (file: File) => {
    try {
      const parsed = await parseImportFile(file);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      setImportDialogData(items);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao importar",
        description: e instanceof Error ? e.message : "Arquivo inválido.",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.name.endsWith(".json")) {
      processImportFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Selecione um arquivo .json exportado pelo Karoot.",
      });
    }
    e.target.value = "";
  };

  const handleImportConfirm = async (selected: ExportedQuiz[]) => {
    for (const q of selected) {
      await libSaveQuiz({ title: q.title, questions: q.questions });
    }
    await refresh();
    setImportDialogData(null);
    toast({
      title: "Quiz(zes) importado(s)",
      description:
        selected.length === 1
          ? `"${selected[0].title}" foi adicionado à biblioteca.`
          : `${selected.length} quizzes foram adicionados à biblioteca.`,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.name.endsWith(".json")) {
      processImportFile(file);
    } else {
      toast({
        variant: "destructive",
        title: "Arquivo inválido",
        description: "Arraste um arquivo .json exportado pelo Karoot.",
      });
    }
  };

  return (
    <main
      className="min-h-screen p-8 lg:p-12"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        className={cn(
          "mx-auto w-full max-w-4xl space-y-6 transition-all",
          isDragging && "ring-2 ring-primary ring-dashed rounded-lg p-2 -m-2"
        )}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Biblioteca de Quizzes</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="text-sm text-muted-foreground">
                  {user.displayName}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="mr-1 h-4 w-4" />
                  Sair
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/">Voltar</Link>
              </Button>
              <Button variant="outline" onClick={handleImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                Importar Quiz
              </Button>
              <Button asChild>
                <Link href="/host/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Novo Quiz
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {!user && !authLoading && (
          <Card className="border-dashed bg-muted/50">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Entre com Google para salvar seus quizzes na nuvem e acessar de
                  qualquer dispositivo.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={signInWithGoogle}>
                <LogIn className="mr-2 h-4 w-4" />
                Entrar com Google
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-muted-foreground">
          Gerencie seus quizzes e inicie salas com apenas um clique.
        </p>

        {libraryLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </CardContent>
          </Card>
        )}

        {!libraryLoading && quizzes.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
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
            {selectedIds.size > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportSelected}
                className="ml-2"
              >
                <Download className="mr-1 h-4 w-4" />
                Exportar Selecionados ({selectedIds.size})
              </Button>
            )}
          </div>
        )}

        {!libraryLoading && quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileQuestion className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Nenhum quiz salvo ainda
              </h3>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Crie seu primeiro quiz e salve-o na biblioteca para reutilizar
                quantas vezes quiser. Ou importe um arquivo .json.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="lg" onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Quiz
                </Button>
                <Button asChild size="lg">
                  <Link href="/host/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Novo Quiz
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !libraryLoading ? (
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
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(quiz.id)}
                      onChange={() => handleToggleSelect(quiz.id)}
                      className="mt-1.5 h-4 w-4 rounded border-gray-300 shrink-0"
                    />
                    <div className="min-w-0">
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
                      onClick={() => handleExport(quiz)}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      Exportar
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
        ) : null}

        <AdSense
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER}
          format="horizontal"
          className="mt-8"
        />
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

      <ImportQuizDialog
        open={!!importDialogData}
        onOpenChange={(open) => !open && setImportDialogData(null)}
        quizzes={importDialogData ?? []}
        onConfirm={handleImportConfirm}
      />
    </main>
  );
}
