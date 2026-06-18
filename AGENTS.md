# Instruções para agentes — Hootka

## Acessibilidade

Este projeto tem `ACCESSIBILITY.md` na raiz. **Leia-o antes de propor mudanças de UI.**

Skills de acessibilidade instaladas em `.agents/skills/` (fonte: [mgifford/accessibility-skills](https://github.com/mgifford/accessibility-skills)).

### Skills obrigatórias por contexto

| Contexto | Skill |
|----------|-------|
| Qualquer trabalho de a11y | `.agents/skills/accessibility-general/SKILL.md` |
| Cores, paletas, temas | `.agents/skills/color-contrast/SKILL.md` |
| Formulários e validação | `.agents/skills/forms/SKILL.md` |
| Teclado e foco | `.agents/skills/keyboard/SKILL.md` |
| Timer, toasts, feedback dinâmico | `.agents/skills/aria-live-regions/SKILL.md` |
| Header, rotas, navegação | `.agents/skills/navigation/SKILL.md` |
| Gráficos e distribuição de respostas | `.agents/skills/charts-graphs/SKILL.md` |
| Modo claro/escuro | `.agents/skills/light-dark-mode/SKILL.md` |
| Testes manuais / AT | `.agents/skills/manual-testing/SKILL.md` |
| CI e guardrails | `.agents/skills/ci-cd/SKILL.md` |
| Regras axe-core | `.agents/skills/axe-rules/SKILL.md` |

### Skills do projeto (Hootka)

| Contexto | Skill |
|----------|-------|
| Identidade visual e tokens | `.cursor/skills/hootka-ui/SKILL.md` |
| UI criativa / layout | `.cursor/skills/frontend-design/SKILL.md` |

### Atualizar skills de acessibilidade

```bash
npm run skills:accessibility
```

Isso usa `skills-lock.json` para rastrear versões instaladas.
