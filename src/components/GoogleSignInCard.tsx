"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";
import { useState } from "react";

interface GoogleSignInCardProps {
  title?: string;
  description?: string;
}

export function GoogleSignInCard({
  title = "Entre com Google",
  description = "Use sua conta Google para criar quizzes, salvar na nuvem e publicar na comunidade.",
}: GoogleSignInCardProps) {
  const { signInWithGoogle, loading } = useAuth();
  const [pending, setPending] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          className="w-full"
          disabled={loading || pending}
          onClick={async () => {
            setPending(true);
            try {
              await signInWithGoogle();
            } finally {
              setPending(false);
            }
          }}
        >
          {pending || loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Entrando...
            </>
          ) : (
            "Entrar com Google"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
