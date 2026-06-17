"use client";

import { useRouter } from "next/navigation";
import { GoogleSignInCard } from "@/components/GoogleSignInCard";
import { GlobalQuizForm } from "@/components/GlobalQuizForm";
import { QuizCreatePageShell } from "@/components/QuizCreatePageShell";
import { createGlobalQuiz } from "@/lib/globalQuizClient";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CreateCommunityQuizPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const isCreator = Boolean(user && !user.isAnonymous);

  if (!user || !isCreator) {
    return (
      <QuizCreatePageShell
        title="Novo quiz global"
        description="Publique um quiz comunitário com ranking global."
        backHref="/community/quizzes"
        maxWidth="2xl"
      >
        <GoogleSignInCard
          title="Entre com Google para criar um quiz"
          description="Sua conta Google verificada é usada para publicar e gerenciar quizzes comunitários."
        />
      </QuizCreatePageShell>
    );
  }

  return (
    <QuizCreatePageShell
      title="Novo quiz global"
      description="Publique um quiz comunitário com ranking global."
      backHref="/community/quizzes"
    >
      <GlobalQuizForm
        loading={loading}
        isAdmin={profile?.role === "admin"}
        submitLabel="Criar quiz global"
        onSubmit={async (values) => {
          setLoading(true);
          try {
            const { quiz } = await createGlobalQuiz(values);
            toast({
              title: "Quiz criado",
              description: "Seu quiz global já está disponível.",
            });
            router.push(`/community/quizzes/${quiz.id}`);
          } finally {
            setLoading(false);
          }
        }}
      />
    </QuizCreatePageShell>
  );
}
