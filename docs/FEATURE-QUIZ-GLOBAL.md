# Feature: Quiz Global

Documentação da feature de quizzes globais assíncronos no Hootka.

---

## Visão geral

O Quiz Global é um modo de produto separado do fluxo de sala ao vivo. Permite que usuários joguem quizzes de forma assíncrona, com ranking global e limite de tentativas configurável.

### Principais características

- **Catálogo híbrido**: quizzes oficiais (`official`) e comunitários (`community`)
- **Autenticação por e-mail**: magic link como identidade principal
- **Ranking global**: pontuação baseada em acerto + tempo de resposta
- **Limite de tentativas**: configurável por quiz, com override por admin
- **Perguntas flexíveis**: 2 a 5 alternativas, 1 resposta correta

---

## Fluxo do usuário

```mermaid
flowchart TD
  A[Catálogo /quizzes] --> B[Detalhe do quiz /quizzes/[slug]]
  B --> C{Autenticado?}
  C -->|Não| D[Login com magic link]
  D --> E[Retorno ao quiz]
  C -->|Sim| E
  E --> F[Jogar /quizzes/[slug]/play]
  F --> G[Responde perguntas com timer]
  G --> H{Todas respondidas?}
  H -->|Não| G
  H -->|Sim| I[Ranking /quizzes/[slug]/ranking]
  I --> J[Ver pontuação e ranking]
```

---

## Rotas e páginas

| Rota | Descrição |
|------|-----------|
| `/quizzes` | Catálogo de quizzes publicados |
| `/quizzes/[slug]` | Detalhe do quiz público (descrição, leaderboard, botão jogar) |
| `/quizzes/[slug]/play` | Tela de jogo do quiz |
| `/quizzes/[slug]/ranking` | Ranking completo do quiz |
| `/community/quizzes` | Meus quizzes (criador) |
| `/community/quizzes/create` | Criar novo quiz |
| `/community/quizzes/[quizId]` | Detalhe/admin do quiz (criador) |
| `/community/quizzes/[quizId]/edit` | Editar quiz |

---

## Modelo de dados

### Entidades

**GlobalQuiz**
- `id`, `slug`, `title`, `description`, `topic`
- `questions`: array de perguntas
- `visibility`: `official` | `community`
- `status`: `draft` | `published` | `archived`
- `attemptLimit`: número ou `null` (ilimitado)
- `questionTimeLimitMs`: tempo por pergunta em ms
- `createdBy`, `createdByUsername`, `createdAt`, `updatedAt`, `publishedAt`

**Question** (perguntas com 2–5 alternativas)
- `text`: enunciado
- `options`: array de strings (2 a 5 alternativas)
- `correctOptionIndex`: índice da resposta correta

**GlobalQuizAttempt**
- `id`, `quizId`, `userId`, `username`, `email`
- `status`: `in_progress` | `completed` | `abandoned`
- `currentQuestionIndex`, `questionStartTimestamp`
- `answers`: mapa de respostas por índice da pergunta
- `totalScore`, `totalResponseTime`, `startedAt`, `updatedAt`, `completedAt`

**GlobalQuizUserStats**
- `attemptsUsed`, `extraAttemptsGranted`
- `activeAttemptId`: tentativa em andamento
- `bestScore`, `bestResponseTime`, `bestAttemptId`
- `lastAttemptAt`

**GlobalQuizLeaderboardEntry**
- `userId`, `username`, `score`, `totalResponseTime`, `attemptId`, `completedAt`

---

## Estrutura no Firebase Realtime Database

| Path | Descrição |
|------|-----------|
| `globalQuizzes/{quizId}` | Quiz completo |
| `globalQuizSlugs/{slug}` | Mapeamento slug → quizId |
| `globalQuizAttempts/{quizId}/{attemptId}` | Tentativas |
| `globalQuizUserStats/{quizId}/{uid}` | Estatísticas por usuário por quiz |
| `globalQuizLeaderboard/{quizId}/{uid}` | Entrada no ranking (melhor resultado) |

O ranking é materializado: cada usuário tem apenas sua melhor entrada por quiz.

---

## APIs

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/global-quizzes` | Lista quizzes publicados (ou `?mine=1` com auth) |
| GET | `/api/global-quizzes/slug/[slug]` | Quiz público por slug + leaderboard |
| GET | `/api/global-quizzes/id/[quizId]` | Quiz por ID (auth, para edição) |
| POST | `/api/global-quizzes` | Criar quiz (auth) |
| PATCH | `/api/global-quizzes/id/[quizId]` | Atualizar quiz (auth, owner) |
| POST | `/api/global-quizzes/[quizId]/attempts/start` | Iniciar tentativa (auth) |
| POST | `/api/global-quizzes/[quizId]/attempts/submit` | Enviar resposta (auth) |
| POST | `/api/global-quizzes/[quizId]/attempts/finish` | Abandonar tentativa (auth) |
| GET | `/api/global-quizzes/[quizId]/admin/details` | Detalhes admin (auth, owner/admin) |
| POST | `/api/global-quizzes/[quizId]/admin/attempts` | Conceder tentativas extras (auth, admin) |

---

## Cálculo de pontuação

- **Acerto**: `score = MAX_QUESTION_SCORE * (tempo_restante / tempo_limite)`
- **Erro**: `score = 0`
- **Timeout**: `optionIndex = null` → score 0

O ranking ordena por: maior score primeiro, depois menor tempo total de resposta.

---

## Autenticação

- **Magic link**: login por e-mail com `sendSignInLinkToEmail`
- **Callback**: `/auth/email-link` processa o retorno do link
- **Requisições**: `Authorization: Bearer <token>` nas APIs protegidas
- **E-mail verificado**: obrigatório para jogar e publicar

---

## Arquivos principais

```
src/
├── types/quiz.ts              # Tipos GlobalQuiz, GlobalQuizAttempt, etc.
├── server/GlobalQuizEngine.ts # Lógica de negócio
├── lib/
│   ├── globalQuizEngine.ts    # Singleton do engine
│   ├── globalQuizUtils.ts     # Utilitários (slug, sanitize, toPublicQuiz)
│   ├── globalQuizClient.ts    # Cliente HTTP para APIs
│   └── globalQuizApi.ts       # Tratamento de erros
├── hooks/
│   ├── usePublicGlobalQuiz.ts # Quiz público por slug
│   ├── useGlobalQuizCatalog.ts# Catálogo
│   └── useMyGlobalQuizzes.ts  # Meus quizzes
├── app/
│   ├── quizzes/               # Rotas públicas
│   ├── community/quizzes/     # Rotas de criação/edição
│   └── api/global-quizzes/    # APIs
└── components/
    ├── GlobalQuizForm.tsx     # Formulário criar/editar
    └── GlobalQuizLeaderboard.tsx
```

---

## Segurança

- **Respostas corretas**: não expostas ao frontend (`toPublicQuiz` remove `correctOptionIndex`)
- **Validação server-side**: limite de tentativas, auth, e-mail verificado
- **Regras Firebase**: `globalQuizzes` e `globalQuizLeaderboard` leitura pública; `globalQuizAttempts` e `globalQuizUserStats` bloqueados (acesso via Admin SDK)
- **Admin**: identificado por `role: "admin"` em `users/{uid}/profile`

---

## Perguntas com 2–5 alternativas

O tipo `Question` foi atualizado para suportar `options: string[]` com validação de 2 a 5 alternativas. Isso impacta:

- **Biblioteca pessoal**: `QuestionListEditor` permite adicionar/remover alternativas
- **Modo sala**: `QuestionCard` e `GameEngine` já suportam
- **Quiz global**: `GlobalQuizForm` e `QuestionCard` reutilizados

---

## Referência

- Spec original: `.cursor/plans/spec_quiz_global_957ad869.plan.md`
- Changelog de correções: `docs/CHANGELOG-SEGURANCA-E-CORRECOES.md`
