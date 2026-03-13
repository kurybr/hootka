#!/bin/bash
# run-e2e-local.sh - Roda os testes E2E locais do Hootka

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "=== Hootka - Testes E2E Locais ==="
echo ""

# Verifica/instala Chromium
echo "Verificando Chromium do Playwright..."
npx playwright install chromium 2>/dev/null || true

echo ""
echo "Escolha o que rodar:"
echo "  1) Salas ao vivo (websocket) - sem emuladores"
echo "  2) Salas ao vivo - modo headed (navegador visível)"
echo "  3) Sala global (Firebase Emulator) - requer emuladores rodando"
echo "  4) Sala global - modo headed"
echo ""
read -p "Opção [1-4]: " opcao

case $opcao in
  1)
    echo "Rodando testes das salas ao vivo..."
    NEXT_PUBLIC_PROVIDER=websocket npm run test:e2e:live -- --reporter=list
    ;;
  2)
    echo "Rodando testes das salas ao vivo (headed)..."
    NEXT_PUBLIC_PROVIDER=websocket npm run test:e2e:live:headed -- --reporter=list
    ;;
  3)
    echo "Rodando testes da sala global..."
    echo "Certifique-se de que os emuladores estão rodando (npm run emulators:start)"
    read -p "Pressione Enter para continuar..."
    npm run test:e2e:global -- --reporter=list
    ;;
  4)
    echo "Rodando testes da sala global (headed)..."
    echo "Certifique-se de que os emuladores estão rodando (npm run emulators:start)"
    read -p "Pressione Enter para continuar..."
    npm run test:e2e:global:headed -- --reporter=list
    ;;
  *)
    echo "Opção inválida"
    exit 1
    ;;
esac

echo ""
echo "Concluído."
