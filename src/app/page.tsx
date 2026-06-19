import { LogIn, Trophy } from "lucide-react";

import { HomeChoiceCard } from "@/components/home/HomeChoiceCard";
import { HomeFooter } from "@/components/home/HomeFooter";

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:py-16">
        <section
          className="mx-auto w-full max-w-3xl space-y-10"
          aria-labelledby="home-hero-heading"
        >
          <h1
            id="home-hero-heading"
            className="text-center font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            Escolha como deseja começar.
          </h1>

          <nav
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5"
            aria-label="Ações principais"
          >
            <HomeChoiceCard
              href="/quizzes"
              icon={Trophy}
              title="Explorar desafios"
              description="Descubra desafios criados pela comunidade."
            />
            <HomeChoiceCard
              href="/join"
              icon={LogIn}
              title="Ir para uma sala"
              description="Entre com um código e participe de uma partida ao vivo."
            />
          </nav>
        </section>
      </div>

      <HomeFooter />
    </main>
  );
}
