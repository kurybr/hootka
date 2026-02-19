# 🚀 Planejamento de Implementação

## Sistema de Quiz em Tempo Real

------------------------------------------------------------------------

# 1. Visão Geral

Este documento descreve o planejamento estratégico para implementação do
sistema de quiz em tempo real, baseado nas regras de negócio previamente
definidas.

## Stack Definida

-   Frontend: Next.js
-   UI: Shadcn + TailwindCSS
-   Banco de Dados: Firebase Realtime Database
-   Backend opcional: Nest.js (somente se necessário)
-   Alternativa recomendada para lógica segura: Firebase Cloud Functions

------------------------------------------------------------------------

# 2. Estratégia Arquitetural

## 2.1 Princípio

Priorizar simplicidade, escalabilidade e tempo de entrega rápido.

## 2.2 Abordagem Recomendada

-   Utilizar Firebase Realtime Database como motor principal.
-   Evitar backend dedicado inicialmente.
-   Utilizar Cloud Functions para validação de regras críticas
    (pontuação e tempo).
-   Evoluir para Nest.js apenas se houver necessidade futura.

------------------------------------------------------------------------

# 3. Estrutura de Dados Estratégica

Estrutura sugerida no Realtime Database:

rooms/ roomId/ code status currentQuestionIndex questionStartTimestamp
participants/ questions/ answers/

Separação clara entre:

-   Dados estáticos (questions)
-   Estado do jogo (status, currentQuestionIndex)
-   Dados dinâmicos (answers, participants)

------------------------------------------------------------------------

# 4. Estratégia de Tempo

## Regra Central

O tempo oficial deve ser definido pelo servidor.

## Fluxo

1.  Ao iniciar pergunta:
    -   Registrar questionStartTimestamp no servidor.
2.  Ao receber resposta:
    -   Calcular tempo de resposta com base no timestamp oficial.
3.  Ignorar respostas após 120 segundos.

------------------------------------------------------------------------

# 5. Estratégia de Pontuação

## Modelo Recomendado

Utilizar Cloud Function para:

-   Validar se participante já respondeu
-   Validar tempo limite
-   Verificar resposta correta
-   Calcular pontuação proporcional
-   Atualizar pontuação total do participante

## Fórmula

Pontuação = 120 × (tempoRestante / 120)

Apenas respostas corretas recebem pontuação.

------------------------------------------------------------------------

# 6. Estratégia de Ranking

-   Armazenar apenas totalScore no participante.
-   Ordenar ranking no frontend.
-   Atualizar ranking automaticamente via sincronização em tempo real.

Critério de ordenação:

1.  Maior pontuação total
2.  Menor tempo médio de resposta
3.  Ordem de entrada

------------------------------------------------------------------------

# 7. Máquina de Estados da Sala

Estados possíveis:

WAITING → PLAYING → RESULT → FINISHED

A interface deve reagir exclusivamente ao estado atual da sala.

------------------------------------------------------------------------

# 8. Planejamento por Fases

## Fase 1 -- Estrutura Inicial

-   Criar projeto Next.js
-   Configurar Tailwind + Shadcn
-   Configurar Firebase
-   Implementar criação de sala
-   Implementar entrada de participante

## Fase 2 -- Execução do Jogo

-   Implementar início do jogo
-   Sincronização em tempo real do estado
-   Implementar timer visual
-   Implementar envio de resposta
-   Bloquear resposta duplicada

## Fase 3 -- Lógica Segura

-   Implementar Cloud Functions
-   Cálculo oficial de pontuação
-   Atualização automática da pontuação
-   Implementar ranking dinâmico

## Fase 4 -- Estabilidade e Polimento

-   Tratamento de desconexão
-   Feedback visual e animações
-   Tratamento de erros
-   Limpeza automática de salas finalizadas

------------------------------------------------------------------------

# 9. Segurança e Integridade

-   Participante só pode alterar seus próprios dados.
-   Pontuação não pode ser alterada pelo cliente.
-   Status da sala só pode ser alterado pelo Host.
-   Respostas duplicadas devem ser ignoradas.
-   Respostas fora do tempo limite devem ser descartadas.

------------------------------------------------------------------------

# 10. Escalabilidade

-   Suporte a múltiplas salas simultâneas.
-   Suporte inicial estimado: 100 participantes por sala.
-   Evitar listeners desnecessários no frontend.
-   Separar dados estáticos de dados dinâmicos.

------------------------------------------------------------------------

# 11. Decisão Estratégica Final

Recomendação para MVP:

Next.js + Firebase Realtime + Cloud Functions

Somente considerar Nest.js se:

-   Houver necessidade de integração externa
-   Houver necessidade de auditoria avançada
-   O sistema evoluir para ambiente corporativo de grande escala

------------------------------------------------------------------------

# 12. Resultado Esperado

Ao final da implementação, o sistema deve:

✔ Executar quiz em tempo real\
✔ Calcular pontuação baseada em velocidade\
✔ Atualizar ranking automaticamente\
✔ Garantir integridade das regras de negócio\
✔ Proporcionar experiência fluida e competitiva
