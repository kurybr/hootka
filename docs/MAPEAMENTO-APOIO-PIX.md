# Mapeamento de oportunidades — Apoio voluntário via Pix

Documento de descoberta de UX para convites opcionais de apoio financeiro ao Hootka. **Não descreve implementação** — apenas onde e como exibir o convite de forma natural e não intrusiva.

## Contexto

O Hootka é gratuito, possui código open source e é desenvolvido no tempo livre, com custos de hospedagem e infraestrutura.

**Intenção:**

- Sem paywalls, limites de funcionalidade ou banners permanentes.
- Convidar usuários satisfeitos a apoiar voluntariamente **após perceberem valor**.

**Mensagem de referência:**

> ☕ O relatório foi exportado com sucesso.
>
> O Hootka é gratuito e desenvolvido no tempo livre.
>
> Se ele te ajudou hoje, considere pagar um café para o desenvolvedor.
>
> [Apoiar com Pix]

## Princípios observados no produto

O Hootka já usa **toasts de sucesso** como feedback (`toast({ title, description })`) em exportações, importações e criação de salas. Os momentos de maior valor percebido concentram-se em:

- **Hosts** — relatórios, biblioteca, import/export (`/host`, `/host/[roomId]`)
- **Jogadores** — fim de partida ao vivo e ranking global (`/play/[roomId]`, `/quizzes/[slug]/ranking`)
- **Criadores** — publicação e métricas de quiz comunitário (`/community/quizzes/*`)

Não há rodapé global hoje; o `layout.tsx` só renderiza `Header` + conteúdo. Isso favorece convites **contextuais pontuais**, não fixos.

---

## Lista priorizada

### Prioridade 1 — Alta (melhor relação valor × naturalidade)

| # | Local sugerido | Motivo (valor já percebido) | Frequência recomendada | Componente visual |
|---|----------------|----------------------------|------------------------|-------------------|
| **1** | **Exportação CSV na sala encerrada** — após sucesso em `handleExportReport` (`/host/[roomId]`, status `finished`) | O host acabou de extrair dados úteis (ranking ou respostas) para uso externo — exatamente o cenário da mensagem de referência | **1× por exportação bem-sucedida**, com cooldown global de **30 dias** após o usuário dispensar ou clicar em “Apoiar” | **Toast enriquecido** (título de sucesso + 2ª linha com convite + botão “Apoiar com Pix”), ou **card inline** logo abaixo do botão “Exportar CSV” que aparece só após o download |
| **2** | **Tela “Jogo encerrado” do host** — bloco final em `/host/[roomId]` (ranking final + relatórios, antes de “Voltar ao início”) | A partida terminou com sucesso; o host viu ranking, distribuição de respostas e pode exportar — momento forte de “missão cumprida” (aula, evento, encontro) | **1× a cada 3ª partida concluída** ou **1× por mês** (o que ocorrer primeiro); nunca na 1ª partida de um usuário novo | **Card dismissível** (`border-dashed`, tom de agradecimento ☕), abaixo dos relatórios |
| **3** | **Importação concluída na biblioteca** — após `handleImportConfirm` em `/host` | O usuário recuperou/reutilizou conteúdo sem retrabalho; percebeu utilidade prática imediata | **1× por sessão de importação**; cooldown de **14 dias** se dispensado | **Toast com ação secundária** (“Apoiar com Pix”) ou card pequeno que some ao fechar, exibido uma vez após o toast de sucesso |

---

### Prioridade 2 — Média-alta (bom momento, público ou contexto um pouco mais amplo)

| # | Local sugerido | Motivo | Frequência | Componente |
|---|----------------|--------|------------|------------|
| **4** | **Ranking global após tentativa concluída** — `/quizzes/[slug]/ranking` (redirect após `global_quiz_attempt_completed`) | O jogador terminou o quiz, viu a posição e o leaderboard — ciclo completo de valor | **1× por conclusão de tentativa**; cooldown de **14 dias** por usuário | **Card compacto** abaixo do botão “Jogar novamente”, tom celebratório |
| **5** | **Exportação JSON da biblioteca** — toasts de `handleExport` / `handleExportSelected` em `/host` | Backup/portabilidade entregue; usuário “power user” da biblioteca | **1× por lote exportado**; no máximo **1× por semana** | **Toast com botão de ação** (mesmo padrão do CSV) |
| **6** | **Primeira publicação de quiz comunitário** — ao chegar em `/community/quizzes/[quizId]` após criar/editar com `status: "published"` | O criador publicou algo no catálogo — marco de contribuição à comunidade | **Somente na 1ª publicação** (não a cada “Salvar alterações”) | **Card de boas-vindas** no topo da página de detalhes, abaixo do resumo |
| **7** | **Tela “Jogo encerrado” do jogador** — `/play/[roomId]`, status `finished` | Experiência social concluída (ranking, pontuação); valor emocional alto, mas menor probabilidade de apoio financeiro que o host | **A partir da 2ª partida** concluída; **1× a cada 5 partidas** | **Card pequeno e opcional** acima de “Voltar ao início”, mais discreto que no host |

---

### Prioridade 3 — Média (útil com critérios mais restritivos)

| # | Local sugerido | Motivo | Frequência | Componente |
|---|----------------|--------|------------|------------|
| **8** | **Painel do criador com engajamento real** — `/community/quizzes/[quizId]` quando `userStats.length > 0` e marco atingido (ex.: ≥10 tentativas) | O criador vê que o quiz está sendo usado — valor de longo prazo | **1× por marco** (10, 50, 100 tentativas); evento único por marco | **Card inline** na seção de estatísticas, não modal |
| **9** | **Uso recorrente na biblioteca** — `/host` quando `quizzes.length ≥ 3` e usuário retorna (localStorage + contagem de visitas) | Usuário consolidou o Hootka na rotina (professor, facilitador) | **1× quando atinge 3 quizzes salvos** ou **na 5ª visita** à biblioteca | **Card dismissível** no topo da lista, abaixo do cabeçalho |
| **10** | **Sala criada e lobby com participantes** — `/host/[roomId]`, status `waiting`, `participants.length ≥ 1` | O host montou a sala e já tem audiência — valor parcial (evento prestes a começar), mas partida ainda não acabou | **Somente a partir da 2ª sala criada**; **nunca** se o jogo já começou | **Card leve no lobby**, abaixo da lista de participantes — mais fraco que pós-partida |

---

### Prioridade 4 — Baixa / canal passivo (descoberta, não interrupção)

| # | Local | Motivo | Frequência | Componente |
|---|-------|--------|------------|------------|
| **11** | **Página Sobre** (`/about`) — nova seção “Projeto open source” | Usuário buscou contexto; momento reflexivo, não de cobrança | **Permanente**, estático | **Parágrafo + link/botão outline** “Apoiar com Pix” (não banner) |
| **12** | **Política de privacidade** (`/privacy`) | Mesmo perfil informativo da página Sobre | Permanente | Link textual discreto no final |

---

## O que evitar

| Excluído | Por quê |
|----------|---------|
| `/` (home) | Primeira impressão; também concentra AdSense |
| Login / `GoogleSignInCard` / fluxos de auth | Antes de qualquer valor; friccionaria onboarding |
| `status === "playing"` ou `"result"` em `/host/[roomId]` e `/play/[roomId]` | Rodada ativa ou transição rápida (4s auto-avanço no host) |
| `/host/create`, `/host/edit/*`, `/community/quizzes/*/edit` | Telas de edição |
| `/join` | Pré-partida; valor ainda não entregue |
| Cópia do código no lobby **isolada** | Toast “Código copiado!” ocorre **antes** da partida — compartilhar ≠ sucesso do evento |
| Modal obrigatório ou overlay bloqueante | Contraria a intenção de gratuidade voluntária |
| Banner fixo no `Header` ou em `layout.tsx` | Equivalente a cobrança permanente em todas as páginas |

---

## Recomendações transversais (para implementação futura)

### Segmentação por persona

- **Host** → prioridades 1, 2, 3, 5, 9 (maior ROI provável: relatórios e biblioteca).
- **Jogador casual** → 4 e 7, com frequência bem menor.
- **Criador comunitário** → 6 e 8.

### Controle de frequência

- Usar `localStorage` (padrão já usado no projeto para som, consentimento, hostId) com chaves como `hootka_support_prompt_last_shown` e contadores por evento (`games_finished`, `exports_done`).
- Regra sugerida: **nunca na 1ª sessão**; respeitar **“Não mostrar novamente”** por 90 dias.

### Tom e copy

- Amarrar ao evento: *“O relatório foi exportado…”*, *“Sua partida terminou…”*, *“Seu quiz já tem X jogadores…”*.
- Evitar “doação”, “assinatura” ou linguagem comercial; preferir **café / apoio voluntário / projeto gratuito**.

### Acessibilidade

- Toasts com ação: região `aria-live="polite"`.
- Cards dismissíveis: botão “Fechar” com nome acessível e foco gerenciável.
- Contraste do botão Pix conforme skill de cores do projeto (`ACCESSIBILITY.md`, `.agents/skills/color-contrast/`).

---

## Ordem sugerida para um MVP futuro

1. **Exportação CSV (host)** — `src/app/host/[roomId]/page.tsx` (`handleExportReport`)
2. **Tela “Jogo encerrado” do host** — `src/app/host/[roomId]/page.tsx` (status `finished`)
3. **Importação na biblioteca** — `src/app/host/page.tsx` (`handleImportConfirm`)
4. **Ranking global pós-tentativa** — `src/app/quizzes/[slug]/ranking/page.tsx`
5. Demais pontos conforme métricas de dismiss/clique

---

## Resumo executivo

Os melhores momentos são **depois de uma entrega concreta**: exportar relatório, encerrar partida ao vivo (lado host), importar quiz, concluir tentativa no ranking global e publicar quiz comunitário.

O padrão visual mais natural no Hootka atual é **toast enriquecido com ação** (exportações) e **card dismissível** (telas de conclusão). Frequência baixa e cooldown longo mantêm o convite como agradecimento, não como cobrança.

---

## Implementação (MVP)

Convenção técnica: prefixo **`donate`** no código (`DonateDialog`, `/api/donate/config`, `NEXT_PUBLIC_DONATE_*`).

**Regra de audiência:** convites e dialog aparecem **apenas em rotas `/host/*`**. Players (`/play/*`, ranking global, etc.) nunca veem doação.

**Gatilhos implementados no MVP:**

1. Exportação CSV na sala encerrada — toast com ação "Apoiar com Pix"
2. Jogo encerrado (host) — `DonatePromptCard` abaixo dos relatórios
3. Importação na biblioteca — toast com ação "Apoiar com Pix"

**Configuração:** variáveis em `.env.local.example` (`NEXT_PUBLIC_DONATE_PIX_KEY`, `NEXT_PUBLIC_DONATE_MERCHANT_NAME`, `NEXT_PUBLIC_DONATE_MERCHANT_CITY`).

**QR Code:** gerado em runtime a partir da chave Pix via `pix-utils` (`src/lib/donatePixQr.ts`). O dialog exibe apenas o QR e o botão "Copiar chave PIX" (chave não visível na tela).

**Frequência dos convites:** por padrão segue cooldowns em `donatePromptStorage`. Para validar a UX sem esperar, use `NEXT_PUBLIC_DONATE_PROMPT_ALWAYS_SHOW=true` no `.env.local` (reinicie o dev server).
