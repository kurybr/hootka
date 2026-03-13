"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";

function EmailLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeEmailLinkSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        const result = await completeEmailLinkSignIn(window.location.href);
        if (!result.completed || cancelled) return;
        const redirect = searchParams.get("redirect") || result.redirectPath;
        router.replace(redirect);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível concluir o login por e-mail."
        );
      }
    };

    void finish();

    return () => {
      cancelled = true;
    };
  }, [completeEmailLinkSignIn, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Concluindo seu acesso</CardTitle>
          <CardDescription>
            Estamos validando o link enviado para o seu e-mail.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Aguarde um instante...</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function EmailLinkPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Concluindo seu acesso</CardTitle>
              <CardDescription>
                Estamos validando o link enviado para o seu e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Aguarde um instante...</p>
            </CardContent>
          </Card>
        </main>
      }
    >
      <EmailLinkContent />
    </Suspense>
  );
}
