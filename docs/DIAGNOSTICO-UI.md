# Diagnóstico de UI — Hootka

**Data:** 13 de março de 2026  
**URL analisada:** http://localhost:3000  
**Ferramentas:** Chrome DevTools MCP, Lighthouse, Snapshot de acessibilidade

---

## Resumo executivo

A página inicial do Hootka apresenta uma interface limpa e funcional, com **Lighthouse 100/100** em Acessibilidade, Boas Práticas e SEO. Ainda assim, há oportunidades de melhoria em feedback visual, consistência de design, semântica e experiência em dispositivos móveis.

---

## Pontos positivos

- **Lighthouse:** 100 em Acessibilidade, Best Practices e SEO
- **Estrutura semântica:** Uso de `<main>`, `<h1>` e links com texto descritivo
- **Hierarquia visual:** Título, subtítulo e cartões bem organizados
- **Animações:** Transições suaves com Framer Motion (`opacity`, `y`)
- **Botões:** Estados de foco visíveis (`focus-visible:ring-1`)
- **Paleta:** Cores consistentes (slate/foreground)

---

## Pontos a melhorar

### 1. Feedback visual em hover/foco

**Problema:** Os botões e links não têm transição explícita de cor em hover. O `evaluate_script` retornou `hasHover: "none"` para todos os elementos interativos.

**Impacto:** Usuários podem não perceber claramente que os elementos são clicáveis.

**Recomendação:**
- Garantir que `transition-colors` do Button seja aplicada (já está no `buttonVariants`)
- Adicionar `transition` nos links da política de privacidade
- Considerar `scale` ou `brightness` sutil em hover nos cartões (além do `hover:shadow-lg`)

---

### 2. Consistência dos botões

**Problema:** O botão "Criar Sala" usa variante `default` (fundo escuro), enquanto "Entrar em Sala" usa `secondary` e "Explorar Quizzes" usa `outline`. A hierarquia visual está correta, mas pode gerar dúvida sobre qual ação é principal.

**Impacto:** Pode haver confusão sobre a ação principal vs secundárias.

**Recomendação:**
- Manter a hierarquia atual se "Criar Sala" for a ação principal
- Documentar o padrão: 1 primário (default) + 2 secundários (secondary/outline)
- Avaliar se "Entrar em Sala" e "Explorar Quizzes" devem ter o mesmo estilo (secondary ou outline)

---

### 3. Ícones decorativos (SVG) e acessibilidade

**Problema:** Os ícones Lucide (Users, LogIn, Trophy) são SVGs sem `aria-hidden="true"` nem `role="img"` com `aria-label`. No snapshot verbose, aparecem como `image` na árvore de acessibilidade.

**Impacto:** Leitores de tela podem anunciar ícones de forma redundante ou confusa, pois o texto já descreve a ação.

**Recomendação:**
- Adicionar `aria-hidden="true"` nos ícones decorativos (já que o texto ao lado descreve a ação)
- Ou usar `role="img"` e `aria-label` descritivo se forem informativos

---

### 4. Elementos "ignored" na árvore de acessibilidade

**Problema:** No snapshot verbose, vários `div` e containers aparecem como `ignored`. Isso é esperado para elementos de layout, mas pode indicar falta de landmarks ou agrupamento semântico.

**Impacto:** Navegação por landmarks pode ser menos eficiente.

**Recomendação:**
- Considerar `role="group"` ou `aria-labelledby` nos cartões para agrupar título + descrição + botão
- Avaliar se o `Separator` precisa de `role="separator"` ou `aria-hidden`

---

### 5. Responsividade em mobile

**Problema:** O grid usa `md:grid-cols-3`, então em telas pequenas os cartões ficam empilhados. O `max-w-2xl`/`lg:max-w-3xl` pode deixar o conteúdo estreito em viewports grandes.

**Impacto:** Em mobile, a página pode ficar longa; em desktop grande, pode haver muito espaço vazio nas laterais.

**Recomendação:**
- Testar breakpoints em 375px, 768px e 1024px
- Avaliar `max-w-4xl` ou `max-w-5xl` em telas grandes
- Garantir que os cartões tenham altura mínima consistente em layout de coluna única

---

### 6. Banner de cookies

**Problema:** O banner de cookies aparece sobre o conteúdo e pode competir visualmente com a ação principal. Os botões "Recusar" e "Aceitar" têm estilos diferentes (outline vs filled).

**Impacto:** Pode distrair ou confundir o usuário na primeira visita.

**Recomendação:**
- Garantir que o banner não cubra os botões principais em mobile
- Considerar posicionamento fixo no rodapé com `z-index` adequado
- Revisar contraste dos links "política de privacidade" no banner

---

### 7. Link "Política de privacidade"

**Problema:** O link no rodapé usa `text-muted-foreground` com `hover:text-foreground`. Em `rgb(100, 116, 139)` (slate-400), o contraste pode ficar abaixo do ideal para WCAG AA em fundos claros.

**Impacto:** Usuários com baixa visão podem ter dificuldade para ler o link.

**Recomendação:**
- Verificar contraste com ferramentas como WebAIM Contrast Checker
- Considerar `text-foreground/80` ou cor mais escura para garantir ≥4.5:1

---

### 8. Next.js Dev Tools em produção

**Problema:** O botão "Open Next.js Dev Tools" aparece na interface (uid=1_57). Em produção, isso não deveria ser exibido.

**Impacto:** Poluição visual e possível confusão para usuários finais.

**Recomendação:**
- Garantir que o componente de Dev Tools seja renderizado apenas em `process.env.NODE_ENV === 'development'`

---

### 9. Região de notificações

**Problema:** Existe uma `region "Notifications (F8)"` na árvore de acessibilidade. Verificar se é acessível por teclado e se anuncia corretamente novas notificações.

**Impacto:** Usuários de leitores de tela e teclado precisam conseguir acessar e entender as notificações.

**Recomendação:**
- Testar navegação por teclado até a região
- Garantir `aria-live` adequado para atualizações dinâmicas

---

### 10. Cards não são clicáveis como um todo

**Problema:** Apenas os botões dentro dos cards são links. O card em si não é clicável. Em muitos padrões de UI, o card inteiro funciona como link.

**Impacto:** Área clicável menor; usuários podem clicar no card esperando navegação.

**Recomendação:**
- Considerar envolver o `Card` em um `Link` ou usar `asChild` para tornar o card inteiro clicável
- Manter o botão visível para affordance, mas permitir clique em qualquer parte do card

---

## Métricas coletadas

| Métrica | Valor |
|--------|-------|
| Viewport (desktop) | 1578×777 px |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| Lighthouse Mobile (Accessibility) | 100 |
| Botão "Criar Sala" | 169×40 px, bg rgb(15,23,42) |
| Botão "Entrar em Sala" | 169×40 px, bg rgb(241,245,249) |
| Botão "Explorar Quizzes" | 169×40 px, bg rgb(255,255,255) |
| Console | Sem erros (apenas Fast Refresh) |

---

## Priorização sugerida

1. **Alta:** Ícones com `aria-hidden`, link Política de privacidade (contraste)
2. **Média:** Cards clicáveis, consistência de botões, Next.js Dev Tools em prod
3. **Baixa:** Responsividade em viewports extremos, refinamentos de hover

---

## Próximos passos

1. Executar Lighthouse em modo mobile (`device: "mobile"`)
2. Testar fluxos completos (Criar Sala, Entrar em Sala, Quizzes Globais)
3. Validar contraste com ferramenta dedicada
4. Revisar outras páginas do app com o mesmo rigor
