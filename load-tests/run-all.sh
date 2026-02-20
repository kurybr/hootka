#!/usr/bin/env bash
#
# Executa todos os cenários de teste de carga em sequência.
# Aguarda 30s entre testes. Coleta métricas do servidor durante cada teste.
# Gera relatório consolidado ao final.
#
# Pré-requisito: Servidor rodando (yarn dev) em outro terminal
#
# Uso: ./load-tests/run-all.sh
# Ou: bash load-tests/run-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
TARGET="${TARGET:-http://localhost:3000}"
COOLDOWN="${COOLDOWN:-30}"

mkdir -p "$RESULTS_DIR"

echo "=== Testes de Carga - Hootka ==="
echo "Target: $TARGET"
echo "Resultados: $RESULTS_DIR"
echo ""

run_test() {
  local name=$1
  local cmd=$2
  echo "----------------------------------------"
  echo ">>> $name"
  echo "----------------------------------------"

  # Inicia monitor em background (90s) - coleta métricas durante o teste
  OUTPUT="$RESULTS_DIR/metrics-$name.json" TARGET="$TARGET" node "$SCRIPT_DIR/monitor.js" 1000 90 &
  MONITOR_PID=$!
  sleep 2  # aguarda monitor iniciar

  # Executa teste
  if eval "$cmd"; then
    echo "OK: $name"
  else
    echo "FALHOU: $name (exit $?)"
  fi

  # Para monitor
  kill $MONITOR_PID 2>/dev/null || true
  wait $MONITOR_PID 2>/dev/null || true

  echo ""
  echo "Aguardando ${COOLDOWN}s antes do próximo teste..."
  sleep "$COOLDOWN"
  echo ""
}

# Cenários que usam run-with-seed (precisam de sala)
run_test "join-and-play-small" \
  "node $SCRIPT_DIR/run-with-seed.js join-and-play-small --output $RESULTS_DIR/join-and-play-small.json"

run_test "join-and-play-medium" \
  "node $SCRIPT_DIR/run-with-seed.js join-and-play-medium --output $RESULTS_DIR/join-and-play-medium.json"

run_test "A-mass-connection-10" \
  "node $SCRIPT_DIR/run-with-seed.js A-mass-connection-10 --output $RESULTS_DIR/A-mass-connection-10.json"

run_test "A-mass-connection-50" \
  "node $SCRIPT_DIR/run-with-seed.js A-mass-connection-50 --output $RESULTS_DIR/A-mass-connection-50.json"

run_test "E-disconnect-reconnect" \
  "node $SCRIPT_DIR/run-with-seed.js E-disconnect-reconnect --output $RESULTS_DIR/E-disconnect-reconnect.json"

# Cenários que não precisam de seed
run_test "create-room" \
  "npx artillery run $SCRIPT_DIR/scenarios/create-room.yml --output $RESULTS_DIR/create-room.json"

run_test "D-multiple-rooms" \
  "npx artillery run $SCRIPT_DIR/scenarios/D-multiple-rooms.yml --output $RESULTS_DIR/D-multiple-rooms.json"

# Cenários burst (seed-and-start)
run_test "B-burst-response" \
  "node $SCRIPT_DIR/run-burst.js B-burst-response --output $RESULTS_DIR/B-burst-response.json"

echo "========================================"
echo ">>> Gerando relatório consolidado"
echo "========================================"

node "$SCRIPT_DIR/analyze.js"

echo ""
echo "Concluído! Ver load-tests/RESULTS.md"
