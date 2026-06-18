# Changelog: Player Experience V1

Registro das alterações da versão focada na experiência do jogador, paletas de alternativas e consistência visual do fluxo de quiz (sala ao vivo e quiz global).

**Período de referência:** commits a partir de `1159a58` (documentação de stack) até o congelamento da Player Experience V1.

---

## Resumo

Esta versão consolida a interface do jogador em torno de três pilares:

1. **Identidade visual das alternativas** — paletas configuráveis, contraste acessível e estados claros sem “apagar” cores com cinza.
2. **`RoundStatusHeader`** — um único ponto de atenção para o estado da rodada (cronômetro, resposta, timeout, resultado).
3. **Microcopy e ritmo visual** — textos mais profissionais, menos redundância e espaçamento pensado para leitura confortável.

---

## Documentação

### Stack do projeto

- Adicionado `docs/STACK.md` com a stack técnica completa do Hootka.

---

## Paletas de alternativas

### Seletor de paletas (`OptionPalettePicker`)

- Cards em largura total com seleção por borda/anel (sem radio visual).
- Descrições curtas com emojis em `PALETTE_META` (ex.: Brasil 🇧🇷, Pride 🌈).
- Swatches em grade de 4 cores com borda sutil.
- Prévia mini-quiz com alternativas A–D usando os estilos reais da paleta.

### Definição de paletas (`quizOptionPalettes.ts`)

- **Removido** `discardedColor` das paletas — cor de erro não faz parte da identidade visual da paleta.
- **Feedback global** separado das paletas:
  - `QUIZ_FEEDBACK_COLORS.correct` (`#22C55E`)
  - `QUIZ_FEEDBACK_COLORS.incorrect` (`#DC2626`)
  - `OPTION_DEEMPHASIZED_OPACITY` (`0.5`)
- Paleta **Brasil** (`copa`): verde ajustado para `#007A33` (melhor contraste com texto branco).
- Fundos claros: `usesSubtleBorder` + `border-zinc-300 shadow-sm` na UI.
- Estados visuais: `active | selected | correct | incorrect` (removidos `discarded`, `wrong` e cinza `#6B7280`).

### Testes

- `quizOptionPalettes.test.ts` atualizado para contraste e paleta Brasil.

---

## Layout das alternativas

### `QuestionCard`

- Badge de tecla (A/S/D/F) alinhado à esquerda do texto, não mais centralizado.
- Estrutura: `flex items-center gap-4`, texto `text-left leading-snug`.
- Alternativa branca/clara com `border-zinc-300 shadow-sm`.
- Altura mínima `min-h-[92px]`, grade com `auto-rows-fr` e `h-full` para linhas uniformes.
- Removidos badges e mensagens de estado do corpo do card (migrados para `RoundStatusHeader`).

### `ResultCard`

- Removidos badges de acerto/erro/pontuação do topo (estado no header).
- Mantidos sons de vitória/derrota e feedback visual nas alternativas.
- Espaçamento pergunta → alternativas com `mb-6`.

---

## Estados das alternativas durante o jogo

### Comportamento final

| Momento | Comportamento |
|--------|----------------|
| Respondendo | Todas as alternativas com opacidade 1 e cores da paleta |
| Resposta enviada | Selecionada em destaque; demais com opacidade 0,5 |
| Tempo esgotado | Todas com opacidade 0,5 |
| Resultado | Acerto/erro com cor de feedback; demais com paleta + opacidade 0,5 |

### Removido

- Modos experimentais de alternativas dessaturadas/cinzas (`quizAnswerUxExperiment` e flags associadas).
- Filtros CSS `grayscale` / `brightness` em alternativas após resposta.

### Integração

- `play/[roomId]/page.tsx` e `quizzes/[slug]/play/page.tsx`: `timedOut` quando tempo expira sem resposta.

---

## `RoundStatusHeader` (novo componente)

Componente único para comunicar o estado da rodada. Substitui cronômetro, badges e mensagens espalhadas no fluxo do jogador.

### Estados

| Estado | Esquerda | Direita | Barra de progresso |
|--------|----------|---------|-------------------|
| `answering` | Tempo restante | `54s` (destaque `text-3xl font-bold`) | Ativa, diminuindo |
| `answer-registered` | Resposta registrada | Aguardando os demais jogadores... | Congelada no valor ao responder |
| `timed-out` | Tempo esgotado | Preparando próxima pergunta... | Vazia |
| `correct` | Resultado | Acertou • +104 pts | Estática |
| `incorrect` | Resultado | Errou • +0 pts | Estática |

### Hierarquia visual

- **Respondendo:** cronômetro como protagonista; rótulo “Tempo restante” em tom secundário.
- **Demais estados:** texto direito `text-sm font-medium text-muted-foreground`.
- **Resultado:** formato padronizado `Estado • Pontuação` (ex.: `Acertou • +104 pts`, `Errou • +0 pts`).

### Timer (`Timer.tsx`)

- Prop `quietWhenExpired` para o jogador: no timeout, o cabeçalho não exibe “Tempo esgotado!” em vermelho (mensagem fica no `RoundStatusHeader`).
- Host continua usando `Timer` completo via `QuizQuestionCardHeader` sem `roundStatus`.

### Helpers exportados

- `resolvePlayingRoundStatus()`
- `resolveResultRoundStatus()`

---

## Cabeçalho da sala e do card

### Informações da sala (`liveQuizDisplay.ts`)

- Subtítulo da página: `Sala CODE`
- Metadados: `5 perguntas • 60 segundos por pergunta` (sem repetir o código da sala).
- Removida a linha de metadados de **dentro** do card da pergunta.

### `QuizQuestionCardHeader`

- Subtítulo opcional (host ainda pode exibir texto da pergunta).
- Jogador usa `RoundStatusHeader` no lugar do `Timer`.
- Constantes de ritmo vertical:
  - `QUIZ_PLAYER_CARD_HEADER_CLASS` — pergunta ativa (`space-y-2 pt-7 pb-6`)
  - `QUIZ_PLAYER_RESULT_HEADER_CLASS` — tela de resultado (apenas status)
  - `QUIZ_PLAYER_CARD_CONTENT_CLASS` — conteúdo (`pb-8 pt-0`)

---

## Microcopy do jogador (`playerMicrocopy.ts`)

- `PLAYER_AWAITING_OTHERS_MESSAGE` — Aguardando os demais jogadores...
- `PLAYER_TIMEOUT_NEXT_MESSAGE` — Preparando próxima pergunta...
- `PLAYER_SOLO_LABEL` — Jogando sozinho (usado em contextos com ranking; oculto no resultado solo)
- `formatPlayerRankHighlight()` — mensagens de posição no ranking (top 3 com destaque amarelo)
- `PLAYER_RANK_HIGHLIGHT_CLASS` / `PLAYER_RANK_NEUTRAL_CLASS`

### Outras mudanças de texto

- “Resposta registrada” (badge verde removido do card; estado no header).
- “Pontuação total” no lugar de “Pontuação atual” no fluxo do jogador.
- Removido subtítulo “Confira seu desempenho nesta pergunta” na tela de resultado.
- Removido título “Resultado da Rodada” — apenas `Resultado` no `RoundStatusHeader`.

---

## Tela de resultado da rodada

- Ranking **oculto** com apenas 1 jogador; exibe só “Pontuação total: X pontos”.
- Com 2+ jogadores: destaque de posição + componente `Ranking`.
- Espaçamento: `mb-6` (pergunta → alternativas), `mt-6` (alternativas → pontuação).
- Mensagem “⏳ Preparando próxima pergunta...” removida do rodapé (vive no header em timeout).

---

## Ranking (`Ranking.tsx`)

- Visual simplificado para 1 jogador (card único com nome e pts) — usado fora da tela de resultado solo.
- Na tela de resultado com 1 participante: bloco de ranking inteiro omitido.

---

## Ritmo visual e correções de espaçamento

### Problema identificado

- `pb-0` no header + `pt-0` no conteúdo comprimiam barra de progresso e enunciado.
- `space-y-1.5` no `CardHeader` deixava título colado ao status.

### Solução aplicada

- Header do jogador: `space-y-2` entre título e status; `pb-6` antes do enunciado.
- `QuestionCard` / `ResultCard`: `space-y-6` ou `mb-6`/`mt-6` entre blocos.
- Título com `leading-snug` onde aplicável.

---

## Arquivos principais alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/RoundStatusHeader.tsx` | **Novo** — estado unificado da rodada |
| `src/components/QuizQuestionCardHeader.tsx` | Integração do header + tokens de espaçamento |
| `src/components/QuestionCard.tsx` | Layout alternativas + remoção de UI de estado |
| `src/components/ResultCard.tsx` | Remoção de badges; foco em alternativas |
| `src/components/OptionPalettePicker.tsx` | Seletor de paletas refinado |
| `src/components/Ranking.tsx` | Modo solo e ranking entre rodadas |
| `src/components/Timer.tsx` | `quietWhenExpired` |
| `src/lib/quizOptionPalettes.ts` | Paletas, contraste, classNames |
| `src/lib/playerMicrocopy.ts` | **Novo** — textos do jogador |
| `src/lib/liveQuizDisplay.ts` | Subtítulo da sala sem redundância |
| `src/app/play/[roomId]/page.tsx` | Fluxo jogador sala ao vivo |
| `src/app/quizzes/[slug]/play/page.tsx` | Fluxo jogador quiz global |
| `docs/STACK.md` | Documentação de stack |

---

## O que não mudou (por design)

- Regras de negócio e pontuação.
- Lógica de ranking com múltiplos jogadores.
- Animações Framer Motion nas alternativas e transições de opacidade.
- Cores das paletas e feedback (verde/vermelho) além dos ajustes documentados.
- Experiência do **host** (timer completo, texto da pergunta no header).

---

## Filosofia da Player Experience V1

- Um único lugar para entender o estado da rodada (`RoundStatusHeader`).
- Contexto global no cabeçalho da sala; contexto local no card da pergunta.
- Transições por opacidade, preservando identidade das paletas.
- Tom profissional, calmo e legível — sem aparência de formulário ou jogo infantil.

---

## Próximos passos sugeridos (fora deste escopo)

- Tag de release no git (`player-experience-v1` ou similar).
- Testes E2E visuais do fluxo completo (pergunta → resposta → resultado → próxima).
- Revisão de acessibilidade com leitor de tela nos estados do `RoundStatusHeader`.
