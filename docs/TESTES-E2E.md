# Testes E2E Locais

Este documento descreve como rodar os testes E2E do Hootka 100% localmente, com execução visual dos navegadores.

## Pré-requisitos

- Node.js 18+
- **Obrigatório:** instale o browser do Playwright uma vez:
  ```bash
  npx playwright install chromium
  ```

## Salas ao vivo (websocket)

Os testes das salas ao vivo não precisam de banco de dados nem Firebase. O servidor usa Socket.IO com estado em memória.

### Rodar testes

```bash
# Headless (sem abrir janela)
npm run test:e2e:live

# Com navegador visível
npm run test:e2e:live:headed

# Modo UI interativo
npm run test:e2e:ui
# Depois selecione o projeto "live-rooms"
```

O Playwright sobe o servidor automaticamente (`npm run dev`) antes dos testes.

## Sala global (Firebase Emulator)

Os testes da sala global usam Firebase Auth Emulator e Realtime Database Emulator. É necessário subir os emuladores antes de rodar os testes.

### 1. Subir os emuladores

Em um terminal separado:

```bash
npm run emulators:start
```

Deixe esse terminal aberto. Os emuladores ficarão em:

- Auth: `http://127.0.0.1:9099`
- Database: `http://127.0.0.1:9000`
- UI: `http://localhost:4000`

### 2. Rodar os testes

Em outro terminal:

```bash
# Headless
npm run test:e2e:global

# Com navegador visível
npm run test:e2e:global:headed
```

O script faz o seed do emulador automaticamente antes dos testes (usuários e quiz de exemplo).

### Seed manual (opcional)

Para popular o emulador manualmente, com os emuladores já rodando:

```bash
npm run emulators:seed
```

Isso cria:

- **user@test.local** / test123456 (usuário verificado)
- **admin@test.local** / admin123456 (admin verificado)
- Quiz "Quiz de Teste E2E" em `/quizzes/quiz-de-teste-e2e`

## Estrutura dos testes

| Projeto      | Arquivos                          | Provider   |
|-------------|------------------------------------|------------|
| live-rooms  | create-room, join-room, live-room  | websocket  |
| global-room | explore-quizzes, global-room       | firebase   |

## Troubleshooting

### "Executable doesn't exist" (Playwright)

Rode `npx playwright install chromium` para baixar o browser.

### Emuladores não conectam

Confirme que o `projectId` em `.firebaserc` (ex: `hootkaapp`) coincide com o usado nos testes. Os scripts já usam `hootkaapp` por padrão.

### Testes da sala global falham com "Firebase não configurado"

Verifique se os emuladores estão rodando (`npm run emulators:start`) antes de executar `npm run test:e2e:global`.

### Porta 3000 em uso

Se o servidor já estiver rodando, o Playwright reutiliza a instância existente. Para forçar um servidor novo, pare qualquer processo na porta 3000.
