# Testes de Carga - Hootka

Infraestrutura de testes de carga usando [Artillery](https://artillery.io/) com suporte a Socket.IO v4 para simular participantes simultâneos.

## Pré-requisitos

- Node.js 18+
- Servidor do Quiz rodando em `http://localhost:3000` (ou defina `TARGET`)
- Para cenários Playwright: `yarn test:load:playwright:install` (uma vez) para baixar o Chromium. O cenário padrão usa Chromium (evita crash do Chrome no Mac).

## Instalação

```bash
yarn install
# ou
npm install
```

## Como rodar os testes

### 1. Inicie o servidor

Em um terminal:

```bash
yarn dev
```

### 2. (Opcional) Crie uma sala seed para participantes

Para cenários que simulam apenas participantes entrando em uma sala existente:

```bash
node load-tests/seed-quiz.js
```

Saída: `{"roomId":"...","code":"ABC123"}`

Use o `code` na variável de ambiente `ROOM_CODE`:

```bash
ROOM_CODE=ABC123 artillery run load-tests/scenarios/join-and-play.yml
```

### 3. Execute os testes

#### Executar todos os cenários (recomendado)

Para rodar a suíte completa e gerar o relatório consolidado:

```bash
yarn test:load:run-all
```

Isso executa em sequência: join-and-play-small, join-and-play-medium, A-mass-connection-10/50, E-disconnect-reconnect, create-room, D-multiple-rooms e B-burst-response. Entre cada teste há um cooldown de 30s. O monitor coleta métricas do servidor durante cada execução. Ao final, gera `load-tests/RESULTS.md` com tabela de resultados, ponto de quebra e recomendações.

**Variáveis opcionais:**
- `TARGET` – URL do servidor (default: `http://localhost:3000`)
- `COOLDOWN` – segundos entre testes (default: 30)

Exemplo com servidor remoto e cooldown menor:
```bash
TARGET=https://meu-quiz.example.com COOLDOWN=15 yarn test:load:run-all
```

#### Cenários individuais

| Script | Descrição | Usuários |
|--------|-----------|----------|
| `yarn test:load:small` | Teste pequeno | 10 simultâneos |
| `yarn test:load:medium` | Teste médio | 50 simultâneos |
| `yarn test:load:large` | Teste grande | 200 simultâneos |
| `yarn test:load:stress` | Teste de estresse | 500+ (encontrar limite) |
| `yarn test:load:playwright` | Teste Playwright (Chromium headless) | ~15 usuários em 15s |
| `yarn test:load:playwright:headed` | Teste Playwright com navegador visível | ~15 usuários em 15s |
| `yarn test:load:playwright:chrome` | Teste Playwright (Chrome do sistema) | ~15 usuários em 15s |

Ou execute diretamente:

```bash
# Hosts criando salas (cada um cria uma sala)
artillery run load-tests/scenarios/create-room.yml

# Participantes entrando em sala existente (requer ROOM_CODE)
ROOM_CODE=ABC123 artillery run load-tests/scenarios/join-and-play.yml

# Com output em JSON para análise
artillery run load-tests/scenarios/join-and-play.yml --output load-tests/results/run.json
```

## Cenários disponíveis

### Playwright (navegação com navegador real)
- **playwright-join.yml** – Usa Chromium do Playwright (padrão, mais estável). Requer `yarn test:load:playwright:install`.
- **playwright-join-headed.yml** – Navegador visível (não headless). Bom para debug.
- **playwright-join-chrome.yml** – Usa Chrome do sistema. Alternativa se preferir; pode causar crash (SIGABRT) no Mac.

O seed para Playwright usa **seed-quiz-playwright.js**: o host cria a sala via UI (como um usuário real), extrai o código da tela e passa para os participantes. Use `yarn test:load:playwright:seed` para testar o seed isoladamente.

### Básicos
- **create-room.yml** – Hosts criam salas (cada virtual user = 1 host, 1 sala)
- **join-and-play.yml** – Participantes entram em uma sala (requer `ROOM_CODE`)
- **join-and-play-small.yml** – ~10 participantes em 30s
- **join-and-play-medium.yml** – ~50 participantes em 60s
- **join-and-play-large.yml** – ~200 participantes em 90s
- **join-and-play-stress.yml** – 500+ participantes em 120s

### Escalonados (Prompt 23)
- **A-mass-connection-*.yml** – Conexão massiva: 10, 50, 100, 200, 500 participantes na mesma sala
- **B-burst-response.yml** – Resposta simultânea (burst) – requer `seed-and-start.js`
- **C-full-game.yml** – Jogo completo sob carga – requer `seed-and-start.js`
- **D-multiple-rooms.yml** – Múltiplas salas (5 hosts criam 5 salas)
- **D-multiple-rooms-10.yml** – 10 salas simultâneas
- **E-disconnect-reconnect.yml** – Desconexão e reconexão (join + rejoin)

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `TARGET` | URL do servidor | `http://localhost:3000` |
| `ROOM_CODE` | Código da sala (para cenários de participante) | - |

## Relatório de resultados (RESULTS.md)

Após rodar `yarn test:load:run-all` ou cenários com `--output load-tests/results/`, gere o relatório:

```bash
yarn test:load:analyze
```

### Relatório HTML (visualizar no navegador)

O comando `artillery report` foi removido na v2. Gere um relatório HTML local com:

```bash
# Todos os JSON em load-tests/results/
yarn test:load:report:html

# Um arquivo específico (após rodar teste com --output)
yarn test:load:playwright -- --output load-tests/results/playwright.json
node load-tests/report-html.js load-tests/results/playwright.json -o load-tests/results/report.html
```

O script gera `load-tests/results/report.html` e tenta abrir no navegador.

O `analyze.js` lê os JSON em `load-tests/results/`, extrai p50/p95/p99, taxa de erro e memória, identifica o ponto de quebra (p99 > 500ms ou erro > 5%) e escreve `load-tests/RESULTS.md` com:

- Ambiente (Node, plataforma, arquitetura)
- Tabela de resultados por cenário
- Ponto de quebra e gargalos
- Recomendações de otimização
- Limites sugeridos para produção

## Métricas reportadas

- **Latência**: p50, p95, p99 (quando suportado pelo engine)
- **Taxa de erro**: % de requisições que falharam
- **Throughput**: requisições por segundo
- **Contagem**: total de cenários executados

## Monitor de métricas

Durante os testes, colete métricas do servidor:

```bash
# Polling a cada 1s, por 60s, salva em results/metrics.json
OUTPUT=load-tests/results/metrics.json node load-tests/monitor.js 1000 60

# Ou em outro terminal, a cada 0.5s até Ctrl+C
node load-tests/monitor.js 500
```

O endpoint `/api/metrics` retorna: `activeConnections`, `answersProcessedTotal`, `answersProcessedLastSecond`, `memory` (heapUsedMB, rssMB), `uptimeSeconds`.

## Estrutura

```
load-tests/
├── README.md              # Esta documentação
├── RESULTS.md             # Relatório gerado por analyze.js
├── analyze.js             # Analisa resultados e gera RESULTS.md
├── run-all.sh             # Executa todos os cenários em sequência
├── artillery.yml          # Config base
├── functions.js           # Helpers
├── seed-quiz.js           # Cria sala prévia
├── seed-and-start.js      # Cria sala e inicia jogo (para cenários B, C)
├── run-with-seed.js       # Cria sala + executa teste
├── run-burst.js           # Cria sala, inicia jogo, executa B ou C
├── monitor.js             # Coleta métricas do servidor durante teste
├── scenarios/             # Cenários de teste
│   ├── create-room.yml
│   ├── join-and-play*.yml
│   ├── A-mass-connection*.yml
│   ├── B-burst-response.yml
│   ├── C-full-game.yml
│   ├── D-multiple-rooms*.yml
│   ├── E-disconnect-reconnect.yml
│   └── full-game.yml
└── results/               # Outputs (--output)
```
