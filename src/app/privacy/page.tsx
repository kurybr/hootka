import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Política de Privacidade | Quiz em Tempo Real",
  description: "Política de privacidade e uso de cookies do Quiz em Tempo Real",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 py-12 sm:p-8">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm">
            ← Voltar
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="text-muted-foreground">
          Última atualização: {new Date().toLocaleDateString("pt-BR")}
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Coleta de informações</h2>
          <p className="text-muted-foreground leading-relaxed">
            O Quiz em Tempo Real coleta informações de uso através do Google
            Analytics (GA4) e exibe anúncios via Google AdSense. O Analytics
            coleta dados como páginas visitadas, tempo de permanência e eventos
            interativos (criação de sala, entrada em sala, início e fim de
            partidas). O AdSense exibe anúncios personalizados com base em
            cookies e dados de navegação. Esses dados são processados conforme
            as políticas do Google.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Uso de cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies para armazenar sua preferência de consentimento
            (aceitar ou recusar análises e anúncios) e para que o Google
            Analytics e o Google AdSense possam funcionar. Você pode aceitar ou
            recusar o uso de cookies através do banner exibido na primeira
            visita.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Dados armazenados localmente</h2>
          <p className="text-muted-foreground leading-relaxed">
            O aplicativo utiliza o armazenamento local do navegador (localStorage)
            para salvar quizzes criados, identificadores de sessão e sua escolha
            de consentimento. Esses dados permanecem no seu dispositivo e não são
            enviados a servidores externos, exceto quando você consente com o
            Google Analytics.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Compartilhamento</h2>
          <p className="text-muted-foreground leading-relaxed">
            Não vendemos nem compartilhamos seus dados pessoais com terceiros.
            Os dados coletados pelo Google Analytics são processados conforme a
            política de privacidade do Google e podem ser utilizados para
            melhorar nossos serviços.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Seus direitos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Você pode alterar sua preferência de cookies a qualquer momento
            limpando os dados do site no seu navegador ou entrando em contato
            conosco. Em conformidade com a LGPD, você tem direito a acesso,
            correção e exclusão dos seus dados.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Contato</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para dúvidas sobre esta política de privacidade, entre em contato
            através dos canais disponíveis no repositório do projeto.
          </p>
        </section>
      </div>

      <div className="pt-8">
        <Link href="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    </main>
  );
}
