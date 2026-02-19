# 📘 Especificação de Regras de Negócio

## Sistema de Quiz em Tempo Real

------------------------------------------------------------------------

# 1. Objetivo do Sistema

O sistema tem como finalidade permitir a criação e execução de
questionários interativos em tempo real, compostos por perguntas de
múltipla escolha, com pontuação baseada em acerto e velocidade de
resposta.

O jogo deve proporcionar uma experiência competitiva, dinâmica e
transparente para todos os participantes.

------------------------------------------------------------------------

# 2. Papéis do Sistema

## 2.1 Host (Administrador da Sala)

Responsável por:

-   Criar a sala do quiz
-   Inserir perguntas e alternativas
-   Definir a ordem das perguntas
-   Iniciar o jogo
-   Avançar para a próxima pergunta
-   Encerrar o jogo

O Host possui controle exclusivo sobre o fluxo do jogo.

------------------------------------------------------------------------

## 2.2 Participantes

Responsáveis por:

-   Entrar em uma sala existente utilizando um código
-   Informar um nome de usuário obrigatório
-   Responder às perguntas dentro do tempo limite
-   Acompanhar sua pontuação e ranking

------------------------------------------------------------------------

# 3. Estrutura das Perguntas

Cada pergunta deve conter:

-   Um enunciado
-   Exatamente 4 alternativas
-   Apenas 1 alternativa correta
-   Tempo limite de 120 segundos
-   Pontuação máxima de 120 pontos

Não são permitidas perguntas com menos ou mais de quatro alternativas.

------------------------------------------------------------------------

# 4. Entrada na Sala

Para participar:

-   O usuário deve informar um nome
-   O nome deve ser único dentro da sala
-   O nome será exibido publicamente no ranking

Não é permitido alterar o nome após o início do jogo.

------------------------------------------------------------------------

# 5. Fluxo do Jogo

## 5.1 Estado Inicial

-   A sala inicia no estado: AGUARDANDO
-   Participantes podem entrar livremente nesse estado

## 5.2 Início

-   O jogo só pode ser iniciado pelo Host
-   Após o início, não é permitido adicionar novas perguntas
-   A sala passa para o estado: EM ANDAMENTO

------------------------------------------------------------------------

# 6. Regras de Resposta

-   Cada participante pode responder apenas uma vez por pergunta
-   Não é permitido alterar a resposta após o envio
-   Respostas enviadas após o tempo limite não devem ser consideradas
-   Caso o participante não responda dentro do tempo, recebe 0 pontos

------------------------------------------------------------------------

# 7. Regras de Pontuação

## 7.1 Critério de Pontuação

-   Apenas respostas corretas recebem pontos
-   A pontuação máxima por pergunta é 120 pontos
-   A pontuação é proporcional ao tempo restante no momento da resposta

Quanto mais rápido o participante responder corretamente, maior será sua
pontuação.

------------------------------------------------------------------------

## 7.2 Resposta Incorreta

-   Respostas incorretas recebem 0 pontos
-   Não há penalização negativa

------------------------------------------------------------------------

# 8. Critério de Desempate

Em caso de empate na pontuação total, a ordem do ranking deve seguir:

1.  Maior pontuação total
2.  Menor tempo médio de resposta
3.  Ordem de entrada na sala

------------------------------------------------------------------------

# 9. Encerramento da Pergunta

Uma pergunta deve ser encerrada quando:

-   O tempo limite for atingido OU
-   Todos os participantes tiverem respondido

Após o encerramento:

-   A resposta correta deve ser exibida
-   A pontuação da rodada deve ser revelada
-   O ranking geral deve ser atualizado e exibido

------------------------------------------------------------------------

# 10. Ranking

O ranking deve:

-   Exibir todos os participantes
-   Mostrar posição, nome e pontuação total
-   Atualizar após cada pergunta
-   Ser visível para todos os usuários

------------------------------------------------------------------------

# 11. Finalização do Jogo

O jogo termina quando:

-   Todas as perguntas forem concluídas OU
-   O Host encerrar manualmente

Ao final:

-   O ranking final deve ser exibido
-   O vencedor deve ser claramente identificado

------------------------------------------------------------------------

# 12. Regras Gerais

-   O sistema deve funcionar em tempo real
-   Todos os participantes devem visualizar as mesmas informações
    simultaneamente
-   A pontuação não pode ser alterada manualmente
-   A desconexão temporária não deve apagar a pontuação acumulada

------------------------------------------------------------------------

# 13. Critérios de Validação do Sistema

O sistema será considerado válido quando:

✔ Cada pergunta possuir exatamente quatro alternativas\
✔ Apenas uma alternativa for considerada correta\
✔ A pontuação variar conforme velocidade de resposta\
✔ O ranking atualizar ao final de cada pergunta\
✔ Nenhuma resposta após o tempo limite for considerada

------------------------------------------------------------------------

# 14. Experiência Esperada

O sistema deve proporcionar:

-   Competição justa
-   Transparência nas regras
-   Atualização rápida das informações
-   Clareza na exibição de resultados
-   Facilidade de uso tanto para Host quanto para Participantes

