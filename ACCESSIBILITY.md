# Acessibilidade — Hootka

## Meta de conformidade

**WCAG 2.2 Nível AA** para todas as interfaces públicas (jogo, cadastro, ranking e navegação).

## Escopo do produto

| Área | Componentes principais | Skill recomendada |
|------|------------------------|-------------------|
| Botões de resposta e paletas de cor | `QuestionCard`, `quizOptionPalettes.ts`, `OptionPalettePicker` | `.agents/skills/color-contrast/SKILL.md` |
| Atalhos de teclado (A/S/D/F) | `QuestionCard` | `.agents/skills/keyboard/SKILL.md` |
| Formulários de quiz | `LiveRoomForm`, `GlobalQuizForm`, `QuestionListEditor` | `.agents/skills/forms/SKILL.md` |
| Feedback dinâmico (timer, resultado) | `QuestionCard`, `ResultCard`, toasts | `.agents/skills/aria-live-regions/SKILL.md` |
| Navegação e layout | `QuizCreatePageShell`, header, rotas | `.agents/skills/navigation/SKILL.md` |
| Gráficos de distribuição | `AnswerDistribution` | `.agents/skills/charts-graphs/SKILL.md` |
| Temas claro/escuro | `globals.css`, tokens shadcn | `.agents/skills/light-dark-mode/SKILL.md` |

Para qualquer trabalho de acessibilidade, leia primeiro `.agents/skills/accessibility-general/SKILL.md`.

## Requisitos do projeto

### Contraste de cores

- Texto em botões de alternativa: mínimo **4.5:1** (WCAG AA).
- Contraste calculado em `src/lib/quizOptionPalettes.ts` (`getContrastRatio`, `getOptionTextColor`).
- Não usar cor como único indicador de resposta correta (resultado usa ícone + cor).

### Teclado

- Toda ação interativa deve ser alcançável e operável por teclado.
- Atalhos A/S/D/F no jogo não devem conflitar com foco em campos de formulário.
- Indicador de foco visível em todos os controles interativos.

### Formulários

- Labels associados a inputs (`htmlFor` / `id` ou `aria-labelledby`).
- Mensagens de erro identificadas e anunciáveis.
- Agrupamentos lógicos com fieldset/legend quando aplicável.

### HTML semântico

- Preferir elementos nativos (`button`, `label`, `input`) antes de ARIA em `div`.
- ARIA complementa HTML; não substitui.

## Guardrails automatizados

- Testes unitários de contraste: `src/lib/quizOptionPalettes.test.ts`
- E2E Playwright: `tests/e2e/` (expandir com checagens a11y quando relevante)

## Lacunas conhecidas

- Auditoria axe-core automatizada no CI ainda não configurada.
- Testes manuais com leitor de tela não documentados em rotina fixa.

## Definition of Done (a11y)

- [ ] Contraste verificado para cores novas ou alteradas
- [ ] Navegação por teclado testada no fluxo alterado
- [ ] Labels e nomes acessíveis em controles novos
- [ ] Sem regressão em critérios WCAG 2.2 AA do escopo afetado

## Skills instaladas

Coleção [mgifford/accessibility-skills](https://github.com/mgifford/accessibility-skills) em `.agents/skills/`.

Atualizar:

```bash
npm run skills:accessibility
```

Ver `AGENTS.md` para o mapa completo de skills por tópico.

## Licença das skills

Skills derivadas de [mgifford/accessibility-skills](https://github.com/mgifford/accessibility-skills) (AGPL-3.0).
