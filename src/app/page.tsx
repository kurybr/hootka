"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Trophy } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdSense } from "@/components/AdSense";

const playerActionCards = [
  {
    href: "/join",
    title: "Entrar em sala",
    description: "Digite o código e participe do jogo.",
    icon: LogIn,
  },
  {
    href: "/quizzes",
    title: "Explorar quizzes",
    description: "Jogue quizzes públicos e veja o ranking.",
    icon: Trophy,
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
            Crie quizzes interativos e jogue com outras pessoas em tempo real.
          </p>
        </div>

        {/* How it works */}
        <section className="rounded-xl border bg-muted/30 px-6 py-5 text-left max-w-2xl mx-auto">
          <h2 className="text-sm font-medium mb-3 text-foreground">
            Como funciona:
          </h2>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
            <li>Crie uma sala</li>
            <li>Compartilhe o código</li>
            <li>Responda perguntas e veja o ranking</li>
          </ol>
        </section>

        {/* Primary actions: player flows only */}
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 max-w-3xl mx-auto">
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

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/privacy" className="underline hover:text-foreground">
            Política de privacidade
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
