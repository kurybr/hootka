import Link from "next/link";

import { getGitHubRepoUrl } from "@/lib/siteLinks";

const homeActionLinkClass =
  "text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/90";

export default function HomePage() {
  const githubUrl = getGitHubRepoUrl();

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:py-16">
        <section
          className="mx-auto w-full max-w-lg space-y-8 text-center"
          aria-labelledby="home-hero-heading"
        >
          <div className="space-y-4">
            <h1
              id="home-hero-heading"
              className="font-heading text-3xl font-bold leading-snug tracking-tight text-foreground sm:text-4xl"
            >
              Aprenda, ensine e se divirta.
            </h1>
            <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Digite o código de uma sala para entrar ou explore desafios criados pela
              comunidade.
            </p>
          </div>

          <nav
            className="flex flex-col items-center gap-4"
            aria-label="Ações principais"
          >
            <Link href="/join" className={homeActionLinkClass}>
              Ir para uma sala
            </Link>
            <Link href="/quizzes" className={homeActionLinkClass}>
              Explorar desafios
            </Link>
          </nav>
        </section>
      </div>

      <footer className="pb-8 text-center text-sm text-muted-foreground">
        <nav
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2"
          aria-label="Links do site"
        >
          <Link
            href="/about"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Sobre
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/privacy"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Privacidade
          </Link>
          <span aria-hidden="true">·</span>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            GitHub
          </a>
        </nav>
      </footer>
    </main>
  );
}
