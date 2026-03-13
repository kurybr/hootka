"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/providers/AuthProvider";

interface EmailLinkSignInCardProps {
  redirectPath: string;
  title?: string;
  description?: string;
}

export function EmailLinkSignInCard({
  redirectPath,
  title = "Entrar com e-mail",
  description = "Informe seu e-mail e um nome de usuário para receber o link de acesso.",
}: EmailLinkSignInCardProps) {
  const { sendEmailLinkSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await sendEmailLinkSignIn(email, username, redirectPath);
      toast({
        title: "Link enviado",
        description: "Abra o e-mail para concluir seu acesso ao Hootka.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Não foi possível enviar o link",
        description:
          error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email-link-username">
            Nome de usuário
          </label>
          <Input
            id="email-link-username"
            value={username}
            placeholder="Ex: jade-dev"
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email-link-email">
            E-mail
          </label>
          <Input
            id="email-link-email"
            type="email"
            value={email}
            placeholder="voce@exemplo.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Enviando..." : "Receber link de acesso"}
        </Button>
      </CardContent>
    </Card>
  );
}
