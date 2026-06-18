# Stack do Hootka

Referência da stack técnica do projeto. Atualize este arquivo quando adicionar ou remover dependências relevantes.

## Visão geral

```
React 19 + Next.js 15 (App Router)
    ↓
Custom server (Node + Socket.IO)  ←→  salas ao vivo (websocket ou Firebase)
    ↓
Firebase Auth + Realtime Database  ←→  quiz global + ranking
    ↓
Firebase Cloud Functions (pontuação, cleanup)
    ↓
Docker (Node 22 Alpine) em produção
```

## Runtime e linguagem

| Camada | Tecnologia |
|--------|------------|
| Runtime | Node.js 18, 20 ou 22 (recomendado; Docker usa 22) |
| Linguagem | TypeScript 5.7 |
| Execução | `tsx` em dev/prod; `tsc` compila o servidor custom para produção |

## Frontend

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 15 (App Router, `output: "standalone"`) |
| UI | React 19 |
| Estilos | Tailwind CSS 3.4, PostCSS, tailwindcss-animate |
| Componentes | Padrão shadcn/ui (tokens HSL, `cva`, `cn`) |
| Primitivos | Radix UI (Dialog, Separator, Slot, Toast) |
| Utilitários CSS | class-variance-authority, clsx, tailwind-merge |
| Ícones | lucide-react |
| Animações | Framer Motion |
| Efeitos | canvas-confetti |
| Fontes | next/font/google — Montserrat (corpo), Nunito (títulos) |
| Tema | Modo claro/escuro via classe (`darkMode: ["class"]`) |

## Backend e tempo real

| Camada | Tecnologia |
|--------|------------|
| Servidor | Custom server (`server.ts`) — HTTP nativo + handler do Next |
| Salas ao vivo (dev) | Socket.IO 4.8 — estado em memória |
| Produção / quiz global | Firebase 12 (client) + firebase-admin 13 (servidor) |
| Banco de dados | Firebase Realtime Database |
| Autenticação | Firebase Auth — Google, e-mail/senha, magic link, anônimo |
| API | Next.js Route Handlers (`src/app/api/**`) |
| Cloud Functions | Firebase Functions v6 (Node 20) — triggers RTDB + scheduler |
| Provider | `NEXT_PUBLIC_PROVIDER=websocket` ou `firebase` |

Ver também: [Escala salas ao vivo](ESCALA-SALAS.md), [Quiz global](FEATURE-QUIZ-GLOBAL.md).

## IA (opcional)

| Camada | Tecnologia |
|--------|------------|
| Geração de perguntas | OpenRouter API (`OPENROUTER_API_KEY`, modelo configurável) |

## Testes e qualidade

| Camada | Tecnologia |
|--------|------------|
| Unitários | `tsx` executando arquivos `*.test.ts` |
| E2E | Playwright 1.49 (Chromium) |
| Emuladores | Firebase Emulators (Auth + Database) via firebase-tools |
| Lint | ESLint 9 + eslint-config-next |
| Acessibilidade | Meta WCAG 2.2 AA; skills em `.agents/skills/` |

Ver também: [Testes E2E](TESTES-E2E.md), [Acessibilidade](../ACCESSIBILITY.md).

## Infra e deploy

| Camada | Tecnologia |
|--------|------------|
| Container | Docker multi-stage (`node:22-alpine`) |
| Build | `next build` (standalone) + `tsc` do servidor |
| Porta padrão | 3000 |
| Credenciais | `GOOGLE_APPLICATION_CREDENTIALS` ou variáveis `FIREBASE_*` |

## Analytics, ads e consentimento

| Camada | Tecnologia |
|--------|------------|
| Analytics | Google Analytics |
| Monetização | Google AdSense |
| Cookies | Banner de consentimento (`ConsentProvider`) |

## Armazenamento no cliente

| Camada | Tecnologia |
|--------|------------|
| Rascunhos e preferências | localStorage / sessionStorage |
| Dados na nuvem | Firebase Realtime Database + APIs próprias |

## Dependências principais (`package.json`)

### Produção

- next, react, react-dom
- firebase, firebase-admin
- socket.io, socket.io-client
- @radix-ui/react-dialog, @radix-ui/react-separator, @radix-ui/react-slot, @radix-ui/react-toast
- framer-motion, lucide-react, canvas-confetti
- class-variance-authority, clsx, tailwind-merge

### Desenvolvimento

- typescript, tsx
- tailwindcss, tailwindcss-animate, postcss
- eslint, eslint-config-next
- @playwright/test
- firebase-tools
- dotenv

## O que não faz parte da stack

- Jest / Vitest (testes unitários rodam via `tsx`)
- ORM ou banco relacional (dados no Firebase RTDB)
- Redis
- CI configurado no repositório (`.github` ausente)
- @axe-core/playwright instalado (documentado nas skills de a11y, ainda não no CI)

## Variáveis de ambiente

Resumo em [`.env.local.example`](../.env.local.example). Principais:

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_PROVIDER` | `websocket` ou `firebase` |
| `NEXT_PUBLIC_*` Firebase | Config do app web |
| `GOOGLE_APPLICATION_CREDENTIALS` / `FIREBASE_*` | Firebase Admin no servidor |
| `OPENROUTER_API_KEY` | Geração de perguntas com IA (opcional) |
| `MAX_ROOM_PARTICIPANTS` | Limite de jogadores por sala ao vivo |
