"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, LogIn, Trophy } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdSense } from "@/components/AdSense";

const playerActionCards = [
  {
    href: "/quizzes",
    title: "Ranking global",
    description: "Jogue quizzes públicos e suba no ranking.",
    icon: Trophy,
  },
  {
    href: "/community/quizzes",
    title: "Criar quiz",
    description: "Publique seu quiz na comunidade (conta Google).",
    icon: BookOpen,
  },
  {
    href: "/join",
    title: "Sala ao vivo",
    description: "Use o código da sala e jogue em tempo real.",
    icon: LogIn,
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
      <motion.div
        className="mx-auto w-full max-w-4xl space-y-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Hero section */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Hootka
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Quizzes com ranking global e salas ao vivo para jogar em grupo — pontuação por acerto e
            velocidade.
          </p>
        </div>

        <section className="rounded-xl border bg-muted/30 px-6 py-5 text-left max-w-2xl mx-auto space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-semibold text-foreground">O que é o Hootka?</h2>
          <p>
            Plataforma gratuita de quizzes em português: catálogo público com ranking por quiz e
            salas ao vivo para grupos (aulas, eventos, amigos). Pontuação por acerto e tempo de
            resposta.{" "}
            <Link href="/about" className="underline hover:text-foreground">
              Saiba mais
            </Link>
            .
          </p>
        </section>

        {/* How it works */}
        <section className="rounded-xl border bg-muted/30 px-6 py-5 text-left max-w-2xl mx-auto space-y-4">
          <div>
            <h2 className="text-sm font-medium mb-2 text-foreground">Quiz global</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Escolha um quiz no catálogo</li>
              <li>Informe como quer aparecer no ranking</li>
              <li>Responda no tempo e veja sua posição</li>
            </ol>
          </div>
          <div>
            <h2 className="text-sm font-medium mb-2 text-foreground">Sala ao vivo</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>O host cria a sala e compartilha o código</li>
              <li>Participantes entram com o código e um nome</li>
              <li>O host avança as perguntas; ranking em tempo real</li>
            </ol>
          </div>
        </section>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8 max-w-4xl mx-auto">
          {playerActionCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.1 }}
              >
                <Link
                  href={card.href}
                  className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group">
                    <CardHeader className="p-8 sm:p-10">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary/15 transition-colors">
                          <Icon
                            className="h-8 w-8 text-primary sm:h-10 sm:w-10"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-xl sm:text-2xl">
                            {card.title}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {card.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <AdSense
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER}
          format="horizontal"
          className="my-6"
        />

        <p className="text-center text-sm text-muted-foreground space-x-3">
          <Link href="/about" className="underline hover:text-foreground">
            Sobre
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className="underline hover:text-foreground">
            Política de privacidade
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
