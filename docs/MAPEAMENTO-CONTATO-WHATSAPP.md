# Mapeamento estratégico — contato com o criador via WhatsApp

Documento de descoberta de UX para oferecer contato direto com o criador do Hootka. **Não descreve implementação** — apenas onde e como exibir um link para WhatsApp de forma natural e não intrusiva.

## Objetivo

Permitir que usuários interessados possam:

- Tirar dúvidas
- Dar sugestões
- Reportar bugs
- Compartilhar feedback
- Conversar sobre possíveis usos do Hootka
- Entrar em contato com o criador

## Restrições (o que evitar)

- Chat de suporte invasivo
- Widget flutuante permanente
- Pop-up automático
- Botão de WhatsApp fixo ocupando espaço durante partidas

---

## Contexto da experiência atual

| Aspecto | Situação hoje |
|---------|---------------|
| **Navegação** | `Header` sticky com links principais; menu mobile em dialog. Sem link de contato. |
| **Rodapé global** | Não existe no `layout.tsx`. Links "Sobre" e "Privacidade" só na home (`/`). |
| **Durante partidas** | Header some no mobile do jogador (`PlayerMobileFocusProvider`). Telas de jogo (`playing`, `result`) são focadas e rápidas (host avança em ~4s). |
| **Contato explícito** | Privacidade menciona "canais no repositório", sem link. `ErrorBoundary` só oferece recarregar. |
| **Apoio Pix** | Modal contextual em rotas `/host/*` (CSV, importação, IA). Dialog separado do fluxo principal. |
| **IA** | `GlobalQuizAiPromptCard` em criação de sala e quiz comunitário; `QuizAiQuestionBar` para perguntas avulsas. Sucesso abre `DonateQuizAiSuccessDialog`. |

**Princípio reutilizável do Pix** (ver `docs/MAPEAMENTO-APOIO-PIX.md`): convites contextuais após valor entregue ou frustração resolvida — não elementos fixos durante partidas.

---

## Locais sugeridos (com avaliação)

Para cada local: tela, momento do fluxo, problema do usuário, tipo de exposição e nota de potencial (1–5).

### Tier 1 — Alta prioridade (potencial 4–5)

#### 1. Página Sobre (`/about`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | `/about` |
| **Momento** | Usuário busca contexto sobre o projeto, open source, privacidade |
| **Problema resolvido** | Dúvidas gerais, colaboração, usos do Hootka, conversa com quem fez |
| **Exposição** | **Permanente** — seção "Fale com quem fez o Hootka" |
| **Nota** | **5/5** |

Momento de maior intenção de contato, zero competição com gameplay. Complementa bem a seção "Criar seus quizzes" já existente.

---

#### 2. Estados de erro e falha (IA, exportação, API)

| Campo | Detalhe |
|-------|---------|
| **Telas** | `GlobalQuizAiPromptCard` / `QuizAiQuestionBar` (erro inline); export CSV em `/host/[roomId]`; `ErrorBoundary`; banners de erro em várias páginas |
| **Momento** | Imediatamente após mensagem de falha ("Falha ao gerar", "Não foi possível exportar", crash) |
| **Problema resolvido** | Reportar bug com contexto fresco; pedir ajuda quando bloqueado |
| **Exposição** | **Contextual** — link textual secundário abaixo do erro, não modal |
| **Nota** | **5/5** |

Alinha contato com necessidade real. Copy sugerida: *"Algo estranho aconteceu? Me avise no WhatsApp."*

---

#### 3. Política de privacidade — seção Contato (`/privacy`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | `/privacy`, seção 6 "Contato" |
| **Momento** | Dúvidas LGPD, cookies, exclusão de dados |
| **Problema resolvido** | Canal oficial para direitos do titular (hoje só menciona repositório) |
| **Exposição** | **Permanente** |
| **Nota** | **4/5** |

Canal passivo, esperado legalmente. Não é marketing — é utilidade.

---

#### 4. Menu do usuário (Header desktop + dialog mobile)

| Campo | Detalhe |
|-------|---------|
| **Tela** | Qualquer rota com Header visível |
| **Momento** | Usuário abre menu ou vê nav desktop; procura ajuda ou contato |
| **Problema resolvido** | Descoberta do canal sem widget flutuante |
| **Exposição** | **Permanente**, mas **só ao abrir menu** — link "Fale comigo" no fim do menu mobile, texto discreto no desktop |
| **Nota** | **4/5** |

Não ocupa tela durante partidas (Header some no mobile do jogador em rodadas). Descoberta sem invasão.

---

### Tier 2 — Boa prioridade (potencial 3–4)

#### 5. Após gerar quiz com IA

| Campo | Detalhe |
|-------|---------|
| **Telas** | `/host/create`, `/host/edit/*`, `/community/quizzes/create`, `/community/quizzes/*/edit` |
| **Momento** | Após sucesso da IA — hoje abre `DonateQuizAiSuccessDialog` |
| **Problema resolvido** | Feedback sobre qualidade das perguntas, limites de uso, ideias de prompt |
| **Exposição** | **Contextual** — link terciário no dialog de sucesso, separado do "☕ Quero agradecer" |
| **Nota** | **4/5** |

Usuário acabou de usar feature "mágica" e pode querer falar sobre resultado. Cuidado: não misturar apoio financeiro com suporte no mesmo botão.

---

#### 6. Próximo ao modal de apoio (`DonateDialog`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | Modal Pix após CSV, importação, etc. (`/host/*`) |
| **Momento** | Usuário já engajado em relação com o criador |
| **Problema resolvido** | Sugestões, feedback, dúvidas sobre apoio — tom de conversa, não cobrança |
| **Exposição** | **Contextual** — linha discreta no rodapé do modal |
| **Nota** | **4/5** |

Copy distinta do Pix: *"Tem sugestão ou encontrou um bug? Chama no WhatsApp."* Não substituir o CTA de café.

---

#### 7. Após exportar relatório CSV

| Campo | Detalhe |
|-------|---------|
| **Tela** | `/host/[roomId]`, status `finished`, após `handleExportReport` |
| **Momento** | Download iniciado → modal Pix abre hoje |
| **Problema resolvido** | Relatório incompleto, formato estranho, pedido de export PDF |
| **Exposição** | **Contextual** — no `DonateDialog` ou toast pós-export (se no futuro voltar toast) |
| **Nota** | **3/5** |

Bom para hosts power users; quem exportou com sucesso tende a querer contato só se algo falhou — aí o Tier 1 (erro) é mais forte.

---

#### 8. Overlay de reconexão (`ReconnectingOverlay`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | Qualquer sala ao vivo após ~8s sem conexão |
| **Momento** | "Servidor indisponível" + botão recarregar |
| **Problema resolvido** | Reportar instabilidade, saber se é problema local ou do serviço |
| **Exposição** | **Contextual** — link secundário abaixo de "Tentar novamente" |
| **Nota** | **4/5** |

Alto valor quando aparece; frequência baixa evita sensação de suporte invasivo.

---

#### 9. Biblioteca do host (`/host`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | Dashboard de quizzes salvos, import/export JSON |
| **Momento** | Uso recorrente; após importação bem-sucedida (toast de apoio) |
| **Problema resolvido** | Dúvidas sobre biblioteca, sync na nuvem, formatos JSON |
| **Exposição** | **Contextual** pós-import **ou** link permanente discreto no cabeçalho da página (não global) |
| **Nota** | **3/5** |

Público host/facilitador — perfil mais propenso a conversar sobre usos (aulas, eventos).

---

### Tier 3 — Prioridade moderada (potencial 2–3)

#### 10. Página de criação/edição de quiz

| Campo | Detalhe |
|-------|---------|
| **Telas** | `/host/create`, `/host/edit/*`, `/community/quizzes/create`, `/community/quizzes/*/edit` |
| **Momento** | Durante montagem do quiz (shell `QuizCreatePageShell`) |
| **Problema resolvido** | Como estruturar perguntas, paletas, tempo limite, publicação |
| **Exposição** | **Permanente na página**, não global — link no rodapé do shell |
| **Nota** | **3/5** |

Útil para novos criadores; risco de distrair durante edição longa. Preferir link textual pequeno, não botão verde de WhatsApp.

---

#### 11. Painel do criador comunitário (`/community/quizzes/[quizId]`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | Detalhes admin do quiz (stats, leaderboard, relatórios) |
| **Momento** | Criador vê engajamento ou erro ao carregar |
| **Problema resolvido** | Dúvidas sobre métricas, moderação, tentativas extras |
| **Exposição** | **Contextual** em erro de carregamento; **permanente discreto** no restante |
| **Nota** | **3/5** |

Público menor, mas engajado.

---

#### 12. Rodapé da aplicação (novo, seletivo)

| Campo | Detalhe |
|-------|---------|
| **Telas** | Home, `/about`, `/privacy`, `/quizzes`, `/community/quizzes`, `/host` — **nunca** em `/play/*`, `/host/[roomId]` durante jogo |
| **Momento** | Navegação informacional |
| **Problema resolvido** | Descoberta passiva do canal |
| **Exposição** | **Permanente** em páginas "de pausa", ausente em telas de ferramenta/partida |
| **Nota** | **3/5** |

Replicar padrão da home (`Sobre · Privacidade`) com "Contato". Evitar footer global no layout inteiro.

---

#### 13. Tela final do host (`/host/[roomId]`, `finished`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | Ranking final, relatórios, export CSV, "Voltar ao início" |
| **Momento** | Logo após encerrar partida |
| **Problema resolvido** | Compartilhar feedback da sessão, sugerir features de relatório |
| **Exposição** | **Contextual** e **discreto** — abaixo de "Voltar ao início", não card destacado |
| **Nota** | **2/5** |

O doc de Pix já alerta: essa tela compete com ranking e export. WhatsApp aqui só como link textual fino; não card nem botão primário.

---

#### 14. Home (`/`)

| Campo | Detalhe |
|-------|---------|
| **Tela** | Landing com cards de ação e AdSense |
| **Momento** | Primeira visita ou retorno |
| **Problema resolvido** | Descoberta inicial |
| **Exposição** | **Permanente** junto aos links "Sobre · Privacidade" |
| **Nota** | **2/5** |

Primeira impressão — link textual ok; botão WhatsApp destacado seria invasivo e competiria com AdSense.

---

### Tier 4 — Baixa prioridade / evitar (potencial 1–2)

#### 15. Tela final do jogador (`/play/[roomId]`, `finished`)

| Campo | Detalhe |
|-------|---------|
| **Momento** | Após partida, ranking pessoal |
| **Problema** | Feedback casual; baixa probabilidade de contato produtivo |
| **Exposição** | Contextual muito discreto, se algum dia |
| **Nota** | **2/5** |

Jogador casual raramente quer falar com o criador nesse instante.

---

#### 16. Ranking global pós-tentativa (`/quizzes/[slug]/ranking`)

| Campo | Detalhe |
|-------|---------|
| **Momento** | Após completar quiz global |
| **Problema** | Sugestões de quiz, bugs na pontuação |
| **Exposição** | Contextual |
| **Nota** | **2/5** |

Momento celebratório; contato faz mais sentido se houve erro.

---

#### 17. Lobby / partida ativa (`waiting`, `playing`, `result`)

| Campo | Detalhe |
|-------|---------|
| **Telas** | `/host/[roomId]`, `/play/[roomId]` |
| **Momento** | Antes ou durante evento ao vivo |
| **Problema** | — |
| **Exposição** | **Evitar** |
| **Nota** | **1/5** |

Viola explicitamente a restrição de não ocupar espaço durante partidas. Lobby só faria sentido em erro persistente, não como CTA permanente.

---

#### 18. Login, join, telas de auth

| Campo | Detalhe |
|-------|---------|
| **Telas** | `/join`, `GoogleSignInCard`, fluxos de auth |
| **Momento** | Antes de valor entregue |
| **Exposição** | Evitar |
| **Nota** | **1/5** |

Fricciona onboarding; usuário ainda não usou o produto.

---

## Matriz resumida (nota × tipo de exposição)

```
Alta intenção de contato          Descoberta passiva
        │                                  │
   Erro / crash (5)                  Sobre (5)
   Privacidade (4)                   Menu (4)
   Reconexão (4)                     Rodapé seletivo (3)
        │                                  │
   Pós-IA sucesso (4)                Home link texto (2)
   Modal apoio (4)                   Host finished (2)
   Pós-export (3)                    Player finished (2)
```

---

## Recomendação para um MVP futuro (3–4 pontos)

Ordem sugerida, alinhada às restrições de não invasividade:

| Prioridade | Onde | Por quê |
|------------|------|---------|
| **1** | `/about` — seção permanente | Maior intenção, zero conflito com gameplay |
| **2** | Mensagens de erro (IA, export, `ErrorBoundary`) | Contato no pico de necessidade (bugs, bloqueios) |
| **3** | Menu mobile + link discreto no Header | Descoberta sem widget flutuante |
| **4** | Rodapé do `DonateDialog` + dialog pós-IA | Aproveita momentos de relação com o criador, com copy distinta do Pix |

**Opcional complementar:** `/privacy` seção 6 e link na faixa da home (`Sobre · Privacidade · Contato`).

---

## O que evitar

| Padrão | Motivo |
|--------|--------|
| Widget flutuante fixo de WhatsApp | Sensação de chat de suporte invasivo |
| Pop-up automático com link | Contradiz tom orgânico do produto |
| Botão verde durante `playing` / `result` | Ocupa foco da partida; Header já some no mobile do jogador |
| Card destacado na tela final do host | Compete com ranking e export (já documentado para Pix) |
| Mesmo CTA para Pix e WhatsApp | Mistura apoio financeiro com suporte/feedback |
| Banner no Header global | Equivalente a suporte permanente em todas as telas |

---

## Tom de copy sugerido (por contexto)

| Contexto | Exemplo |
|----------|---------|
| Sobre | *"Quer tirar uma dúvida, sugerir algo ou contar como usa o Hootka? Me chama no WhatsApp."* |
| Erro | *"Algo deu errado? Me avisa — ajuda a melhorar o app."* |
| Menu | *"Fale comigo"* |
| Modal apoio | *"Feedback ou bug? Também pode chamar no WhatsApp."* |

---

## Resumo executivo

O Hootka já tem arquitetura favorável a contato **contextual e intencional**: sem rodapé global, Header que some em partidas, modais de apoio só em `/host/*`.

WhatsApp encaixa melhor como **link textual em momentos de reflexão** (`/about`, menu, privacidade) e **de frustração ou curiosidade** (erros, reconexão, pós-IA) — não como presença permanente durante eventos ao vivo.

**Melhor relação esforço × impacto para um MVP:** Sobre + erros + menu + complemento nos modais de apoio/IA.

---

## Implementação (MVP)

Convenção técnica: prefixo **`contact`** no código (`ContactWhatsAppLink`, `contactWhatsApp.ts`, `NEXT_PUBLIC_CONTACT_WHATSAPP_*`).

**Filosofia:** contato contextual e não invasivo — link textual, sem widget flutuante, sem popup automático, sem botão fixo durante partidas.

**Pontos entregues:**

1. **Menu do usuário** (`Header.tsx`) — itens discretos `☕ Apoiar o Hootka` (abre modal Pix) e `💬 Fale comigo` (abre WhatsApp em nova aba), desktop e mobile.
2. **Modal de apoio** (`DonateDialog.tsx`) — rodapé discreto com link apenas em "WhatsApp", abaixo do agradecimento.

**Comportamento:**

- WhatsApp: `https://wa.me/{numero}?text={mensagem}` com mensagem pré-preenchida.
- Apoiar no menu funciona em qualquer rota (config Pix carregada globalmente no `DonateProvider`).
- Gatilhos automáticos de doação (CSV, import, IA) continuam restritos a `/host/*` via `isHostContext`.
- Header some no mobile do jogador durante partidas (`PlayerMobileFocusProvider`).

**Configuração** (`.env.local.example`):

- `NEXT_PUBLIC_CONTACT_WHATSAPP_NUMBER` — E.164 sem `+` (ex.: `5511999999999`)
- `NEXT_PUBLIC_CONTACT_WHATSAPP_ENABLED` — opcional; default `true` se número válido
- `NEXT_PUBLIC_CONTACT_WHATSAPP_CREATOR_NAME` — nome na saudação (default `Jorge`)

**Mensagem pré-preenchida:**

```
Olá, Jorge!

Estou usando o Hootka e queria conversar sobre:
```

**Eventos GA:** `contact_whatsapp_clicked` com parâmetro `source` (`header_menu`, `donate_dialog`).

**Arquivos principais:** `src/lib/contactWhatsApp.ts`, `src/components/ContactWhatsAppLink.tsx`, `src/components/layout/Header.tsx`, `src/components/DonateDialog.tsx`, `src/providers/DonateProvider.tsx`.
