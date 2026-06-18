# Hootka

Plataforma de quizzes com **ranking global** (assíncrono) e **salas ao vivo** (sincronizadas). Pontuação por acerto e velocidade.

## Requisitos

- Node.js 18, 20 ou 22 (recomendado; evite versões muito novas se o build falhar)
- Conta Google Firebase (Auth + Realtime Database) para modo produção

## Instalação

```bash
npm install
cp .env.local.example .env.local
```

Preencha `.env.local` conforme a seção abaixo.

## Variáveis de ambiente

Veja [`.env.local.example`](.env.local.example). Resumo:

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_PROVIDER` | `websocket` (dev rápido, salas só em memória) ou `firebase` (produção) |
| `NEXT_PUBLIC_*` Firebase | Config do app web (Realtime Database + Auth) |
| Credenciais Admin | `GOOGLE_APPLICATION_CREDENTIALS` ou `FIREBASE_*` no servidor (API routes / quiz global) |
| `MAX_ROOM_PARTICIPANTS` | Limite de jogadores por sala ao vivo (padrão: 100) |
| `OPENROUTER_API_KEY` | Opcional: geração de perguntas com IA |
| `OPENROUTER_MODEL` | Opcional: modelo OpenRouter (ex.: `openai/gpt-4o-mini`) |

### Firebase — login anônimo (jogadores do quiz global)

No **Firebase Console** → Authentication → Sign-in method, habilite **Anonymous**.

Criadores usam **Google**; jogadores do quiz global podem usar sessão anônima + nome no ranking.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Next.js + servidor custom com Socket.IO (salas modo websocket) |
| `npm run build` | Build do frontend |
| `npm run build:all` | Build Next + servidor TypeScript |
| `npm run start` | Produção (`NODE_ENV=production`) |
| `npm run emulators:start` | Emuladores Auth + Database |
| `npm run emulators:seed` | Dados de teste no emulador |
| `npm run test:e2e` | Playwright |

## Modos de tempo real (sala ao vivo)

- **`NEXT_PUBLIC_PROVIDER=websocket`**: estado em memória no processo Node; bom para desenvolvimento; **não** escala para várias instâncias.
- **`NEXT_PUBLIC_PROVIDER=firebase`**: estado no Realtime Database; use em produção com **uma única instância Next** ou documente limites (ver [`docs/ESCALA-SALAS.md`](docs/ESCALA-SALAS.md)).

## Documentação

- [Quiz global](docs/FEATURE-QUIZ-GLOBAL.md)
- [Testes E2E](docs/TESTES-E2E.md)
- [Escala salas ao vivo](docs/ESCALA-SALAS.md)
- [Acessibilidade](ACCESSIBILITY.md) — meta WCAG 2.2 AA e skills para agentes em `.agents/skills/`

## Licença

Projeto privado (`private` no `package.json`).
