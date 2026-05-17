import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Sobre o Hootka",
  description:
    "Conheça o Hootka: quizzes com ranking global e salas ao vivo para jogar em grupo.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 py-12 sm:p-8">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Voltar
          </Button>
        </Link>
      </div>

      <article className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight font-heading">Sobre o Hootka</h1>
        <p className="text-muted-foreground leading-relaxed">
          O Hootka é uma plataforma gratuita de quizzes em português. Você pode jogar quizzes
          públicos com ranking global ou reunir amigos em uma sala ao vivo, com pontuação por
          acerto e velocidade de resposta.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold font-heading">Quiz global</h2>
          <p className="text-muted-foreground leading-relaxed">
            No catálogo de quizzes globais, cada desafio traz título, tema e descrição. Ao
            iniciar uma tentativa, você responde no tempo limite de cada pergunta e sua
            pontuação entra no ranking daquele quiz. Quizzes oficiais são curados pela equipe;
            quizzes comunitários são criados por usuários com conta Google.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold font-heading">Sala ao vivo</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para jogar em grupo, um participante atua como host: cria a sala, escolhe o quiz e
            compartilha o código. Os demais entram com o código e um nome de exibição. O host
            controla quando cada pergunta é liberada; todos veem o ranking atualizado em tempo
            real. É ideal para aulas, eventos e encontros informais.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold font-heading">Criar seus quizzes</h2>
          <p className="text-muted-foreground leading-relaxed">
            Com login Google, você pode montar quizzes manualmente ou com ajuda de IA, publicar
            na comunidade e acompanhar tentativas. A biblioteca do host também permite importar
            e exportar quizzes em JSON para reutilizar em salas ao vivo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold font-heading">Privacidade e anúncios</h2>
          <p className="text-muted-foreground leading-relaxed">
            O site pode exibir anúncios do Google AdSense apenas em páginas informativas (como
            esta e o catálogo de quizzes), nunca durante partidas ou em telas de ferramenta
            (criar sala, lobby, jogo). Você controla cookies de análise e publicidade no banner
            de consentimento. Detalhes na{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              política de privacidade
            </Link>
            .
          </p>
        </section>
      </article>

      <div className="flex flex-wrap gap-3 pt-4">
        <Button asChild>
          <Link href="/quizzes">Ver quizzes</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Página inicial</Link>
        </Button>
      </div>
    </main>
  );
}
