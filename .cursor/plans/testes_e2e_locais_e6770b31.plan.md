---
name: Testes E2E Locais
overview: Adicionar uma infraestrutura de testes E2E com Playwright que rode 100% local, com execução visual dos navegadores, cobrindo salas ao vivo via `websocket` e sala global via Firebase Emulator com usuários e dados seedados localmente.
todos:
  - id: playwright-base
    content: Configurar Playwright no repositório com scripts locais e execução visual/headed.
    status: completed
  - id: firebase-emulators
    content: Adicionar suporte do app aos emuladores locais de Auth e Realtime Database.
    status: completed
  - id: seed-reset
    content: Criar seed e reset determinísticos de usuários e dados para testes locais.
    status: completed
  - id: live-room-e2e
    content: Expandir a suíte das salas ao vivo com cenários multiusuário reais em websocket.
    status: completed
  - id: global-room-e2e
    content: Criar a suíte da sala global usando usuários e banco do Firebase Emulator.
    status: completed
  - id: docs-runbook
    content: Documentar como subir o ambiente e rodar os testes localmente do zero.
    status: completed
isProject: false
---

# Plano para Testes E2E Locais

## Objetivo

Criar uma suíte E2E confiável com Playwright para cobrir:

- salas ao vivo
- sala global
- execução totalmente local
- navegadores visíveis durante a execução

## Diagnóstico atual

- O app já suporta trocar o provider de tempo real em `[/Users/jade/Workspace/playground/hootka/src/providers/RealTimeContext.tsx](/Users/jade/Workspace/playground/hootka/src/providers/RealTimeContext.tsx)`: `websocket` para salas ao vivo e `firebase` para o fluxo global.
- As salas ao vivo já conseguem rodar localmente via servidor custom em `[/Users/jade/Workspace/playground/hootka/server.ts](/Users/jade/Workspace/playground/hootka/server.ts)`, com estado em memória.
- A sala global hoje depende de autenticação e banco Firebase no backend em `[/Users/jade/Workspace/playground/hootka/src/server/auth.ts](/Users/jade/Workspace/playground/hootka/src/server/auth.ts)` e `[/Users/jade/Workspace/playground/hootka/src/lib/firebaseAdmin.ts](/Users/jade/Workspace/playground/hootka/src/lib/firebaseAdmin.ts)`.
- Já existem specs iniciais em `[/Users/jade/Workspace/playground/hootka/tests/e2e/create-room.spec.ts](/Users/jade/Workspace/playground/hootka/tests/e2e/create-room.spec.ts)` e `[/Users/jade/Workspace/playground/hootka/tests/e2e/join-room.spec.ts](/Users/jade/Workspace/playground/hootka/tests/e2e/join-room.spec.ts)`, mas falta a infraestrutura formal do Playwright no repositório.

## Estratégia proposta

### 1. Formalizar a infraestrutura Playwright

Adicionar a base oficial do runner para que os testes possam ser executados sempre do mesmo jeito.

Arquivos principais:

- `[/Users/jade/Workspace/playground/hootka/package.json](/Users/jade/Workspace/playground/hootka/package.json)`
- `[/Users/jade/Workspace/playground/hootka/playwright.config.ts](/Users/jade/Workspace/playground/hootka/playwright.config.ts)`
- `[/Users/jade/Workspace/playground/hootka/tests/e2e](/Users/jade/Workspace/playground/hootka/tests/e2e)`

Mudanças planejadas:

- adicionar `@playwright/test`
- criar `playwright.config.ts` com `baseURL`, `webServer`, traces, screenshots e vídeos
- criar scripts como `test:e2e`, `test:e2e:headed` e `test:e2e:ui`
- configurar execução visual por padrão nos scripts locais, com browser aberto

## 2. Habilitar ambiente 100% local para a sala global

A sala global exige banco e usuários locais, então a proposta é usar Firebase Emulator em vez de bypass de autenticação.

Arquivos principais:

- `[/Users/jade/Workspace/playground/hootka/firebase.json](/Users/jade/Workspace/playground/hootka/firebase.json)`
- `[/Users/jade/Workspace/playground/hootka/.env.local.example](/Users/jade/Workspace/playground/hootka/.env.local.example)`
- `[/Users/jade/Workspace/playground/hootka/src/lib/firebase.ts](/Users/jade/Workspace/playground/hootka/src/lib/firebase.ts)`
- `[/Users/jade/Workspace/playground/hootka/src/lib/firebaseAdmin.ts](/Users/jade/Workspace/playground/hootka/src/lib/firebaseAdmin.ts)`

Mudanças planejadas:

- configurar emuladores de `auth` e `database` no `firebase.json`
- adicionar flags de ambiente para o app conectar automaticamente nos emuladores quando estiver em modo de teste
- adaptar o cliente Firebase para usar `connectAuthEmulator` e `connectDatabaseEmulator`
- adaptar o Firebase Admin para inicialização local sem depender de credencial real de produção
- definir variáveis de ambiente específicas de teste, separando `websocket` e `firebase`

## 3. Criar seed e reset de dados locais

Os testes precisam começar sempre com usuários e banco previsíveis.

Arquivos principais:

- `[/Users/jade/Workspace/playground/hootka/tests/e2e/fixtures](/Users/jade/Workspace/playground/hootka/tests/e2e/fixtures)`
- `[/Users/jade/Workspace/playground/hootka/tests/e2e/global](/Users/jade/Workspace/playground/hootka/tests/e2e/global)`
- `[/Users/jade/Workspace/playground/hootka/scripts](/Users/jade/Workspace/playground/hootka/scripts)`

Mudanças planejadas:

- criar um utilitário para limpar o Realtime Database do emulador antes de cada suite relevante
- criar um seed com usuários fixos locais, por exemplo `user-verificado` e `admin-verificado`
- seedar perfis e quizzes em paths usadas pelo app, como `users/{uid}/profile`, `globalQuizzes`, `globalQuizSlugs` e ranking
- expor helpers reutilizáveis para os testes criarem fixtures sob demanda, em vez de dependerem de dados manuais

## 4. Separar a cobertura por produto

### Salas ao vivo

Executar com `NEXT_PUBLIC_PROVIDER=websocket`, sem banco e sem auth real.

Cobertura planejada:

- host cria sala
- participante entra com código válido
- fluxo multi-contexto host + player em dois navegadores/contextos
- avanço de pergunta e atualização em tempo real
- ranking e encerramento

Base existente:

- `[/Users/jade/Workspace/playground/hootka/tests/e2e/create-room.spec.ts](/Users/jade/Workspace/playground/hootka/tests/e2e/create-room.spec.ts)`
- `[/Users/jade/Workspace/playground/hootka/tests/e2e/join-room.spec.ts](/Users/jade/Workspace/playground/hootka/tests/e2e/join-room.spec.ts)`

Expansão proposta:

- reaproveitar os smoke tests atuais
- adicionar fixtures de criação de quiz e helpers para capturar código da sala
- usar dois contexts do Playwright para validar sincronização real do jogo

### Sala global

Executar com provider Firebase apontando para emuladores locais.

Cobertura planejada:

- login/local auth do usuário seedado
- listagem de quizzes globais
- abertura de quiz por slug
- iniciar tentativa
- responder perguntas e finalizar
- ranking/resultado final
- fluxo administrativo mínimo de criação/publicação, se fizer parte do escopo inicial

Pontos de integração:

- `[/Users/jade/Workspace/playground/hootka/src/app/api/global-quizzes/route.ts](/Users/jade/Workspace/playground/hootka/src/app/api/global-quizzes/route.ts)`
- `[/Users/jade/Workspace/playground/hootka/src/server/auth.ts](/Users/jade/Workspace/playground/hootka/src/server/auth.ts)`
- `[/Users/jade/Workspace/playground/hootka/src/lib/firebase.ts](/Users/jade/Workspace/playground/hootka/src/lib/firebase.ts)`

## 5. Criar um fluxo de login testável localmente

O maior risco técnico do global é autenticação E2E local. A proposta é evitar depender de e-mail real ou popup externo.

Abordagem recomendada:

- usar usuários seedados no Auth Emulator
- fazer login programático no cliente de teste, ou via helper/página de teste controlada por ambiente
- persistir a sessão antes de abrir as rotas autenticadas

Resultado esperado:

- os testes do global não dependerão de Gmail, magic link nem projeto Firebase remoto
- os usuários serão recriados localmente a cada execução

## 6. Orquestração local dos serviços

Padronizar um único comando para levantar tudo que os testes precisam.

Serviços esperados:

- app Next/custom server local
- Firebase Emulator Auth
- Firebase Emulator Realtime Database
- Playwright em modo visual

Implementação planejada:

- scripts npm para subir ambiente de teste local
- `webServer` do Playwright ou script wrapper para coordenar app + emuladores
- documentação objetiva com ordem de execução e troubleshooting

## 7. Cuidados e riscos

- O fluxo global não ficará 100% local sem suporte explícito aos emuladores no código.
- O fluxo atual de auth server-side exige token válido do Firebase; por isso seed de usuário sem autenticação real não basta.
- Se funções Firebase de salas também forem ligadas ao mesmo banco local, pode haver colisão com a lógica já existente nas API routes/servidor local. O plano deve isolar a suíte de salas ao vivo em `websocket` e a suíte global em `firebase`.

## Resultado final esperado

Ao final da implementação, o projeto terá:

- Playwright configurado oficialmente no repositório
- execução visual local dos navegadores
- dados e usuários locais recriados automaticamente
- testes E2E confiáveis para salas ao vivo e sala global
- documentação clara para qualquer pessoa rodar a suíte do zero

