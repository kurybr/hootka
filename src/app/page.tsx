import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
      <div className="mx-auto w-full max-w-2xl space-y-8 text-center lg:max-w-3xl">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Quiz em Tempo Real
          </h1>
          <p className="text-muted-foreground">
            Crie ou entre em uma sala para começar a jogar
          </p>
        </div>

        <Separator />

        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="p-6 lg:p-8">
              <CardTitle className="text-lg lg:text-xl">Criar Sala</CardTitle>
              <CardDescription>
                Crie uma nova sala, adicione perguntas e convide participantes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 lg:p-8 lg:pt-0">
              <Button asChild size="lg" className="w-full">
                <Link href="/host">Criar Sala</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="p-6 lg:p-8">
              <CardTitle className="text-lg lg:text-xl">Entrar em Sala</CardTitle>
              <CardDescription>
                Entre em uma sala existente usando o código fornecido pelo host
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 lg:p-8 lg:pt-0">
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href="/join">Entrar em Sala</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
