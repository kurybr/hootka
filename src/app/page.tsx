"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { HomeJoinCard } from "@/components/home/HomeJoinCard";
import {
  ContactWhatsAppLink,
  useContactWhatsAppEnabled,
} from "@/components/ContactWhatsAppLink";
import { AdSense } from "@/components/AdSense";
import { Button } from "@/components/ui/button";
import { getGitHubRepoUrl } from "@/lib/siteLinks";

const howItWorksSteps = [
  { step: "①", title: "Explore", description: "Descubra quizzes" },
  { step: "②", title: "Crie", description: "Inicie uma sala" },
  { step: "③", title: "Compartilhe", description: "Envie o código" },
  { step: "④", title: "Jogue", description: "Acompanhe o ranking" },
] as const;

export default function HomePage() {
  const githubUrl = getGitHubRepoUrl();
  const whatsAppEnabled = useContactWhatsAppEnabled();

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-20 px-6 py-16 sm:py-24 lg:py-28">
        <section className="space-y-8 text-center" aria-labelledby="home-hero-heading">
          <div className="space-y-4">
            <h1
              id="home-hero-heading"
              className="font-heading text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl"
            >
              Aprenda, ensine e se divirta com quizzes ao vivo.
            </h1>
            <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Digite o código de uma sala para começar
              <br className="hidden sm:block" />
              ou explore quizzes criados pela comunidade.
            </p>
          </div>

          <HomeJoinCard />

          <div className="flex flex-col items-center gap-3">
            <span className="text-xs text-muted-foreground">ou</span>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/quizzes">Explorar quizzes</Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="how-it-works-heading">
          <h2
            id="how-it-works-heading"
            className="mb-8 text-center font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Como funciona
          </h2>
          <ol className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-6">
            {howItWorksSteps.map(({ step, title, description }) => (
              <li key={title} className="text-center">
                <p className="mb-2 text-lg text-muted-foreground/80" aria-hidden="true">
                  {step}
                </p>
                <p className="font-medium text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="rounded-xl border border-border/60 bg-muted/20 px-6 py-8 text-center sm:px-8"
          aria-labelledby="home-ai-heading"
        >
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 id="home-ai-heading" className="font-heading text-base font-semibold">
                Crie quizzes com IA
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Descreva um tema e o Hootka cria perguntas, alternativas e respostas
              automaticamente.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/community/quizzes/create">Criar quiz</Link>
            </Button>
          </div>
        </section>

        <AdSense
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER}
          format="horizontal"
          className="mx-auto w-full"
        />

        <footer className="space-y-6 border-t border-border/60 pt-8 text-center text-sm text-muted-foreground">
          <nav
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            aria-label="Links do site"
          >
            <Link href="/about" className="underline-offset-4 hover:text-foreground hover:underline">
              Sobre
            </Link>
            <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
              Privacidade
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              GitHub
            </a>
          </nav>

          {whatsAppEnabled && (
            <p className="text-xs leading-relaxed text-muted-foreground/90">
              Dúvidas ou sugestões?{" "}
              <ContactWhatsAppLink variant="inline" source="home_footer" className="text-xs">
                Fale comigo
              </ContactWhatsAppLink>
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
