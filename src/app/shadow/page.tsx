"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { authFetch } from "@/lib/authFetch";
import {
  isShadowLoginEnabledClient,
  isValidShadowEmail,
  normalizeShadowEmail,
} from "@/lib/shadowLogin";

function ShadowLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user,
    profile,
    loading: authLoading,
    signInWithShadowToken,
    signInWithGoogle,
    isShadowSession,
  } = useAuth();

  const emailParam = searchParams.get("email") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const startedRef = useRef(false);

  const shadowEnabled = isShadowLoginEnabledClient();

  useEffect(() => {
    if (!shadowEnabled || authLoading || startedRef.current) return;

    if (!emailParam) {
      setError("Informe o e-mail na URL: /shadow?email=usuario@exemplo.com");
      return;
    }

    const email = normalizeShadowEmail(emailParam);
    if (!isValidShadowEmail(email)) {
      setError("E-mail inválido na URL.");
      return;
    }

    if (!user || profile?.role !== "admin") {
      setError(null);
      setStatus("Faça login como administrador para personificar esta conta.");
      return;
    }

    if (isShadowSession) {
      router.replace("/host");
      return;
    }

    startedRef.current = true;
    setStatus("Iniciando modo investigação...");
    setError(null);

    void (async () => {
      try {
        const res = await authFetch("/api/dev/shadow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = (await res.json()) as {
          token?: string;
          uid?: string;
          email?: string;
          error?: string;
        };

        if (!res.ok || !data.token || !data.uid || !data.email) {
          throw new Error(data.error ?? "Não foi possível iniciar o shadow.");
        }

        await signInWithShadowToken(data.token, {
          email: data.email,
          uid: data.uid,
        });
        router.replace("/host");
      } catch (err) {
        startedRef.current = false;
        setStatus(null);
        setError(
          err instanceof Error ? err.message : "Não foi possível iniciar o shadow."
        );
      }
    })();
  }, [
    authLoading,
    emailParam,
    isShadowSession,
    profile?.role,
    router,
    shadowEnabled,
    signInWithShadowToken,
    user,
  ]);

  if (!shadowEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Indisponível</CardTitle>
            <CardDescription>
              O shadow login só funciona em desenvolvimento ou com a flag
              ALLOW_SHADOW_LOGIN habilitada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Voltar</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Shadow login</CardTitle>
          <CardDescription>
            Personificação para investigação local (somente admin).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailParam ? (
            <p className="text-sm text-muted-foreground">
              Alvo: <span className="font-medium text-foreground">{emailParam}</span>
            </p>
          ) : null}

          {status ? (
            <p className="text-sm text-muted-foreground" role="status">
              {status}
            </p>
          ) : null}

          {error ? (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {!user && !authLoading ? (
            <Button
              type="button"
              className="w-full"
              onClick={() =>
                void signInWithGoogle().catch((err) =>
                  setError(
                    err instanceof Error ? err.message : "Erro ao fazer login."
                  )
                )
              }
            >
              Entrar com Google (admin)
            </Button>
          ) : null}

          <Button variant="outline" asChild className="w-full">
            <Link href="/">Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ShadowLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <p className="text-muted-foreground">Carregando...</p>
        </main>
      }
    >
      <ShadowLoginContent />
    </Suspense>
  );
}
