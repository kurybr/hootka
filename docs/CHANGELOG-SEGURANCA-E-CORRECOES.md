# Changelog: Segurança e Correções

Documentação das alterações realizadas no projeto Hootka.

---

## 1. Correção de Bug: Erro ao Responder Quiz Global

### Problema
Ao responder uma pergunta no quiz global (`/quizzes/[slug]/play`), ocorria o erro:
```
Cannot read properties of undefined (reading '0')
```

### Causa
O objeto `attempt.answers` vinha `undefined` do Firebase quando a tentativa era recém-criada (sem respostas ainda). O código acessava `attempt.answers[questionKey]` onde `questionKey` era `"0"`, gerando `undefined["0"]`.

### Solução
- Adicionada verificação defensiva: `const answers = attempt.answers ?? {}`
- Uso de `answers` em vez de `attempt.answers` nas validações e ao montar `nextAttempt`

### Arquivos alterados
- `src/server/GlobalQuizEngine.ts`

---

## 2. Normalização de Dados do Firebase

### Problema
Quizzes ou perguntas carregados do Firebase podiam ter estrutura incompleta (`questions` ou `options` undefined), causando erros ao acessar propriedades.

### Solução
- Criada função `normalizeQuestionFromFirebase()` em `questionUtils.ts` para tratar perguntas com `options` undefined
- `getQuizById` passa a normalizar `questions` ao carregar do Firebase
- `submitAnswer` normaliza as perguntas antes de usar

### Arquivos alterados
- `src/lib/questionUtils.ts`
- `src/server/GlobalQuizEngine.ts`

---

## 3. Correções de Segurança

### 3.1 Remoção de `correctOptionIndex` nas respostas do Quiz Global (ALTA)

**Problema:** O frontend recebia a resposta correta antes e durante a tentativa, permitindo trapaça.

**Solução:**
- Criados tipos `PublicQuestion` e `PublicGlobalQuiz` sem `correctOptionIndex`
- Função `toPublicQuiz()` remove a resposta correta das perguntas
- Aplicado em: `getPublicQuizBySlug`, `startAttempt`, `submitAnswer`, `listPublishedQuizzes`, `listQuizzesByOwner`
- `QuestionCard` atualizado para receber `PublicQuestion`

**Arquivos alterados:**
- `src/types/quiz.ts`
- `src/lib/globalQuizUtils.ts`
- `src/server/GlobalQuizEngine.ts`
- `src/components/QuestionCard.tsx`
- `src/lib/globalQuizClient.ts`
- `src/hooks/usePublicGlobalQuiz.ts`
- `src/hooks/useGlobalQuizCatalog.ts`
- `src/hooks/useMyGlobalQuizzes.ts`

### 3.2 Remoção de `correctIndex` na API de respostas do Quiz em Sala (ALTA)

**Problema:** A rota `/api/firebase/rooms/[roomId]/answer` retornava o índice da alternativa correta.

**Solução:**
- Removido `correctIndex` da resposta da API e do `GameEngine.submitAnswer`
- Removido do `SocketHandler` (modo Socket.IO)
- Cliente usa `room.questions[index].correctOptionIndex` na tela de resultado (dados já presentes na sala)

**Arquivos alterados:**
- `src/app/api/firebase/rooms/[roomId]/answer/route.ts`
- `src/server/GameEngine.ts`
- `src/server/SocketHandler.ts`
- `src/providers/FirebaseProvider.ts`
- `src/providers/SocketIOProvider.ts`
- `src/providers/IRealTimeProvider.ts`
- `src/types/events.ts`

### 3.3 Redução de Logs Sensíveis (MÉDIA)

**Problema:** Logs incluíam `userId`, `attemptId` e stack traces em produção.

**Solução:**
- Logs de request/success na rota de submit apenas em desenvolvimento
- Logs de erro em `globalQuizErrorResponse` apenas em desenvolvimento
- Removidos `userId` e `attemptId` dos logs

**Arquivos alterados:**
- `src/lib/globalQuizApi.ts`
- `src/app/api/global-quizzes/[quizId]/attempts/submit/route.ts`

### 3.4 Headers de Segurança (MÉDIA)

**Solução:** Adicionados headers em `next.config.ts`:
- `X-Frame-Options: SAMEORIGIN` — previne clickjacking
- `X-Content-Type-Options: nosniff` — previne MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Arquivos alterados:**
- `next.config.ts`

### 3.5 Validação de Slug contra Path Traversal (BAIXA)

**Problema:** O parâmetro `slug` poderia conter caracteres perigosos (`..`, `/`).

**Solução:**
- Função `isValidSlug()` em `globalQuizUtils.ts`
- Regex `/^[a-z0-9-]+$/`, rejeita `..`, `/` e caracteres especiais
- Validação na rota `api/global-quizzes/slug/[slug]`

**Arquivos alterados:**
- `src/lib/globalQuizUtils.ts`
- `src/app/api/global-quizzes/slug/[slug]/route.ts`

---

## 4. Regras do Firebase Realtime Database

### Estrutura das regras (`database.rules.json`)

| Caminho | Leitura | Escrita |
|---------|---------|---------|
| `rooms/$roomId` | Pública | Pública |
| `rooms/$roomId/participants/$participantId/totalScore` | — | auth ou host |
| `rooms/$roomId/answers/$questionIndex/$participantId` | — | Apenas criação |
| `users/$uid` | Próprio usuário | Próprio usuário |
| `globalQuizzes` | Pública | Bloqueada |
| `globalQuizSlugs` | Pública | Bloqueada |
| `globalQuizLeaderboard` | Pública | Bloqueada |
| `globalQuizAttempts` | Bloqueada | Bloqueada |
| `globalQuizUserStats` | Bloqueada | Bloqueada |

**Nota:** `globalQuizAttempts` e `globalQuizUserStats` são acessados apenas pelo Admin SDK no servidor.

### Como publicar as regras

```bash
firebase deploy --only database
```

Ou copiar o conteúdo de `database.rules.json` e colar no Firebase Console → Realtime Database → Regras.

### Testando as regras

No Firebase Console, use o **Laboratório de testes de regras** com caminhos específicos:
- `/globalQuizzes` — leitura pública (deve permitir)
- `/rooms/{roomId}` — leitura pública (deve permitir)
- `/users/{uid}` — apenas o próprio usuário autenticado

---

## 5. Resumo de Arquivos Modificados

```
src/
├── app/api/
│   ├── firebase/rooms/[roomId]/answer/route.ts
│   └── global-quizzes/
│       ├── [quizId]/attempts/submit/route.ts
│       └── slug/[slug]/route.ts
├── components/
│   └── QuestionCard.tsx
├── hooks/
│   ├── useGlobalQuizCatalog.ts
│   ├── useMyGlobalQuizzes.ts
│   └── usePublicGlobalQuiz.ts
├── lib/
│   ├── globalQuizApi.ts
│   ├── globalQuizClient.ts
│   └── globalQuizUtils.ts
├── providers/
│   ├── FirebaseProvider.ts
│   ├── IRealTimeProvider.ts
│   └── SocketIOProvider.ts
├── server/
│   ├── GameEngine.ts
│   ├── GlobalQuizEngine.ts
│   └── SocketHandler.ts
└── types/
    ├── events.ts
    └── quiz.ts

next.config.ts
```

---

## 6. Falhas de Segurança Identificadas (Não Corrigidas Nesta Sessão)

O relatório de análise de segurança identificou itens que ainda podem ser tratados:

- **Rotas Firebase sem autenticação** — create, join, answer, start, etc.
- **hostId e participantId confiados no cliente** — validação via token
- **Regras do Firebase em `rooms` permissivas** — `.read: true` e `.write: true`
- **Rate limiting** — ausente em todas as rotas
- **Validação de body** — em admin/attempts e rotas Firebase
