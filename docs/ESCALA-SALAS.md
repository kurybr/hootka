# Escala das salas ao vivo

Este documento resume limites e boas práticas para salas com muitos participantes (50–100+).

## Produção recomendada

- Use `NEXT_PUBLIC_PROVIDER=firebase` e o **Firebase Realtime Database** como fonte da verdade.
- O modo `websocket` (padrão em dev) mantém o estado **na memória de um único processo** — não escale horizontalmente nem persista entre reinícios.

## Limite de participantes

- O servidor aplica `MAX_ROOM_PARTICIPANTS` (padrão **100**, máximo **500** no código) em `joinRoom` no `GameEngine`.
- Ajuste via variável de ambiente no host que roda a API (`MAX_ROOM_PARTICIPANTS=120`).

## Leituras no cliente (Firebase)

- O cliente usa **ouvintes por ramo** no `FirebaseProvider`: `code`, `hostId`, `status`, `currentQuestionIndex`, `questionStartTimestamp`, `participants`, `questions` e apenas **`answers/{índiceAtual}`** — evita baixar todas as respostas de todas as rodadas a cada alteração.
- Escritas nas salas devem passar pelas **API routes** com **Firebase Admin** (`FirebaseStore`), não pelo SDK no navegador.

## Regras de segurança

- `database.rules.json` define `rooms` como **leitura pública e escrita proibida** para clientes. Isso evita que participantes alterem pontuação ou estado manualmente.

## Cloud Functions

- Opcional: `functions/src/index.ts` pode validar respostas e atualizar placar no RTDB. Se estiver em uso, faça o deploy no projeto Firebase e monitore cold start e quotas.

## Teste de carga

- Use `src/lib/serverMetrics.ts` no modo WebSocket ou as métricas do console Firebase (largura de banda, conexões simultâneas).
- Objetivo de referência: **50 participantes**, **10 perguntas**, transições de estado em até ~2s percebidos pelo jogador (depende de rede e região do RTDB).

## Instâncias Node

- O servidor custom em `server.ts` inclui Socket.IO para o modo WebSocket. Em produção com Firebase, múltiplas réplicas do Next **compartilham** o mesmo RTDB; não é necessário sticky session para o estado do jogo, desde que o provider seja `firebase`.
