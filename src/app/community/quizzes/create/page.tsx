"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmailLinkSignInCard } from "@/components/EmailLinkSignInCard";
import { GlobalQuizForm } from "@/components/GlobalQuizForm";
import { createGlobalQuiz } from "@/lib/globalQuizClient";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CreateCommunityQuizPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <main className="min-h-screen p-8 lg:p-12">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <Button variant="outline" asChild>
            <Link href="/community/quizzes">Voltar</Link>
          </Button>
          <EmailLinkSignInCard
            redirectPath="/community/quizzes/create"
            title="Entre para criar um quiz"
            description="Seu e-mail verificado será usado para publicar e gerenciar quizzes."
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
            <h1 className="text-3xl font-bold">Novo quiz global</h1>
            <p className="text-muted-foreground">
              Publique um quiz comunitário com ranking global.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/community/quizzes">Voltar</Link>
          </Button>
        </div>

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
      </div>
    </main>
  );
}
