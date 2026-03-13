# Diagnóstico de UX — Hootka

**Data:** 13 de março de 2026  
**Escopo:** Fluxos principais (Criar Sala, Entrar em Sala, Quizzes Globais)  
**Base:** Análise de código, DevTools MCP, mapeamento de rotas e componentes

---

## Resumo executivo

O Hootka oferece fluxos claros e feedback consistente em ações críticas. A experiência é funcional, mas há oportunidades de melhoria em **orientação do usuário**, **onboarding**, **recuperação de erros** e **consistência de nomenclatura**. A ausência de navegação global e a referência a "Karoot" em mensagens podem gerar confusão.

---

## Pontos positivos

- **Fluxos bem definidos:** Cada jornada (Criar Sala, Entrar, Quizzes) tem início, meio e fim claros
- **Feedback imediato:** Toast em sucesso/erro, loading em botões, estados visuais
- **Validação em tempo real:** Formulário de join com regras claras (código 6 chars, nome 2–30)
- **Empty states:** Biblioteca vazia e catálogo com mensagens orientadoras e CTAs
- **Confirmação em ações destrutivas:** Modal antes de excluir quiz
- **Reconexão:** Overlay com retry após 8s em caso de perda de conexão
- **Foco automático:** Campo de código recebe foco na página de join
- **Formatação de código:** "A B C 1 2 3" facilita leitura e digitação

---

## Pontos a melhorar

### 1. Ausência de navegação global

**Problema:** Não há header, menu ou breadcrumb. O usuário depende de botões "Voltar" em cada página. Em fluxos profundos (ex: `/quizzes/[slug]/play`), voltar exige múltiplos cliques.

**Impacto:** Sensação de "labirinto"; dificuldade para mudar de contexto rapidamente.

**Recomendação:**
- Adicionar header fixo com logo "Hootka" (link para `/`) e links para Host, Entrar, Quizzes
- Ou breadcrumb em páginas aninhadas (ex: Quizzes > [Título] > Jogar)
- Manter "Voltar" como fallback para mobile

---

### 2. Inconsistência de nomenclatura: "Karoot" vs "Hootka"

**Problema:** Mensagens de importação mencionam "arquivo .json exportado pelo **Karoot**". O produto atual é **Hootka**.

**Onde aparece:**
- `host/page.tsx`: toast e descrição de erro
- `quizExportImport.ts`: mensagem de validação

**Impacto:** Usuários podem achar que precisam de outro app ou que importaram do lugar errado.

**Recomendação:**
- Substituir "Karoot" por "Hootka" em todas as mensagens
- Ou usar texto genérico: "arquivo .json no formato do Hootka"

---

### 3. Onboarding inexistente

**Problema:** Usuário novo chega na home sem explicação do que é o Hootka nem como funciona. Os cartões descrevem ações, mas não o conceito (quiz em tempo real, sala com código, etc.).

**Impacto:** Usuários podem abandonar antes de entender o valor.

**Recomendação:**
- Adicionar 1–2 frases na home: "Quiz interativo em tempo real. Crie salas, compartilhe o código e jogue com amigos."
- Considerar tooltip ou tour opcional na primeira visita (localStorage)
- Vídeo curto ou GIF demonstrando o fluxo host → participante

---

### 4. Fluxo "Criar Sala" com múltiplos caminhos

**Problema:** O host pode criar sala por:
1. `/host` → Iniciar Sala (quiz da biblioteca)
2. `/host` → Criar Novo Quiz → `/host/create` → Criar Sala
3. `/host/create` direto (sem quiz salvo)

Não fica claro quando usar "Criar Novo Quiz" vs "Iniciar Sala" para quem não tem quizzes salvos.

**Impacto:** Decisão cognitiva desnecessária; usuário pode desistir.

**Recomendação:**
- Na biblioteca vazia, o CTA principal pode ser "Criar e iniciar sala" (vai para create e foca em criar + iniciar)
- Unificar linguagem: "Criar sala" (com ou sem salvar na biblioteca)
- Considerar wizard: Passo 1 – Perguntas | Passo 2 – Salvar? | Passo 3 – Iniciar

---

### 5. Barreira de autenticação em Quizzes Globais

**Problema:** Para jogar quiz global, o usuário precisa fazer login (EmailLinkSignInCard). O bloqueio é imediato, sem preview ou explicação do que ganha ao entrar.

**Impacto:** Fricção alta; usuários podem sair antes de experimentar.

**Recomendação:**
- Permitir 1 tentativa anônima (sem ranking) antes de pedir login
- Ou mostrar preview: "Entre para salvar sua pontuação no ranking global"
- Reduzir campos do EmailLinkSignIn (apenas e-mail, username opcional)

---

### 6. Feedback em erros de rede/API

**Problema:** Erros genéricos como "Erro ao entrar na sala" ou "Erro ao criar sala" não diferenciam causa (sala inexistente, código inválido, rede, servidor).

**Impacto:** Usuário não sabe se deve tentar de novo, verificar o código ou esperar.

**Recomendação:**
- Mapear códigos de erro do backend para mensagens específicas
- Ex.: "Sala não encontrada" (código errado), "Sala cheia", "Conexão perdida"
- Incluir ação sugerida: "Verifique o código e tente novamente"

---

### 7. Página 404 sem contexto

**Problema:** A 404 mostra "Página não encontrada" e "Voltar ao início". Não há link para as páginas principais (Host, Entrar, Quizzes).

**Impacto:** Usuário perdido tem apenas uma saída; pode não saber para onde ir.

**Recomendação:**
- Adicionar links rápidos: Criar Sala, Entrar em Sala, Quizzes Globais
- Ou ilustração + mensagem amigável: "Ops! Essa página não existe. Que tal criar uma sala?"

---

### 8. Código da sala: affordance e recuperação

**Problema:** O placeholder "A B C 1 2 3" é bom, mas não há dica de onde o participante obtém o código. Quem entra pela primeira vez pode não saber que o host vê o código na tela da sala.

**Impacto:** Participantes perguntam "onde está o código?"; host precisa explicar.

**Recomendação:**
- Na descrição do card "Entrar em Sala": "O host vê o código na tela ao criar a sala"
- Ou na página /join: "O código de 6 caracteres aparece na tela do host quando a sala é criada"
- Considerar link "Como obter o código?" para FAQ ou modal

---

### 9. Estado de loading em listas vazias

**Problema:** Em `/quizzes`, quando `loading` é true, o texto "Carregando quizzes..." aparece sozinho. Quando não há quizzes, a grid fica vazia.

**Impacto:** Em catálogo vazio, o usuário pode achar que deu erro.

**Recomendação:**
- Se `loading` e `quizzes.length === 0`: manter "Carregando..."
- Se `!loading` e `quizzes.length === 0`: mostrar empty state: "Nenhum quiz disponível no momento. Crie o primeiro!"
- Diferenciar visualmente loading vs empty

---

### 10. Host desconectado: experiência do participante

**Problema:** Quando o host desconecta, `hostDisconnected` é setado. O participante precisa ver uma mensagem clara e uma ação (ex: voltar ao início).

**Impacto:** Participante pode ficar em tela travada sem saber o que fazer.

**Recomendação:**
- Garantir que `hostDisconnected` mostre overlay ou card com: "O host saiu da sala. Você pode voltar ao início."
- Botão "Voltar ao início" que redireciona para `/`

---

### 11. Cookie banner na primeira visita

**Problema:** O banner aparece logo na primeira visita e compete com a ação principal. Os botões "Recusar" e "Aceitar" têm estilos diferentes (outline vs filled).

**Impacto:** Pode distrair ou confundir; usuário pode não saber o que escolher.

**Recomendação:**
- Posicionar o banner no rodapé (não sobre o conteúdo)
- Deixar "Aceitar" como ação primária e "Recusar" como secundária
- Considerar adiar exibição por 2–3 segundos na primeira visita

---

### 12. Ordenação e filtros no catálogo de quizzes

**Problema:** O catálogo `/quizzes` lista todos os quizzes sem ordenação explícita ou filtro por tema/oficial/comunitário.

**Impacto:** Com muitos quizzes, fica difícil encontrar o desejado.

**Recomendação:**
- Adicionar ordenação: "Mais recentes", "Mais jogados", "Mais populares"
- Filtros: "Oficiais", "Comunitários", por tema
- Busca por título (quando crescer)

---

### 13. Confirmação ao sair de sala em edição

**Problema:** Em `/host/create` ou `/host/edit/[quizId]`, ao clicar em "Voltar" com alterações não salvas, não há confirmação.

**Impacto:** Perda acidental de trabalho.

**Recomendação:**
- Usar `beforeunload` ou `useBlocker` (React Router) para avisar ao sair
- Ou modal: "Você tem alterações não salvas. Deseja mesmo sair?"

---

### 14. Acessibilidade e feedback de teclado

**Problema:** Os botões têm `focus-visible`, mas em fluxos como o jogo (responder perguntas), a navegação por teclado e o feedback de seleção podem ser limitados.

**Impacto:** Usuários que dependem de teclado ou leitores de tela podem ter dificuldade.

**Recomendação:**
- Garantir que todas as alternativas sejam focáveis e acionáveis por Enter/Space
- Revisar ordem de tabulação em modais e formulários
- Testar com usuário de leitor de tela

---

## Jornadas mapeadas

### Jornada 1: Participante entra em sala

```
Home → Entrar em Sala → Código + Nome → [Validação] → /play/[roomId]
         ↓ erro                    ↓ toast + inline
         ↓ sucesso                 → toast "Entrou!" → redirect
```

**Pontos de fricção:** Obter código do host; mensagem de erro genérica.

---

### Jornada 2: Host cria e inicia sala

```
Home → Criar Sala → /host (biblioteca vazia) → Criar Novo Quiz → /host/create
                    ↓
         (tem quiz) → Iniciar Sala → /host/[roomId]
                    ↓
         /host/create → Adicionar perguntas → [Salvar?] → Criar Sala → /host/[roomId]
```

**Pontos de fricção:** Múltiplos caminhos; sem onboarding.

---

### Jornada 3: Jogar quiz global

```
Home → Quizzes Globais → /quizzes → [Quiz] → /quizzes/[slug]
                                              ↓
                                    (não logado) → EmailLinkSignIn
                                    (logado) → Iniciar → /quizzes/[slug]/play
                                                                    ↓
                                                              → /quizzes/[slug]/ranking
```

**Pontos de fricção:** Login obrigatório; sem preview do quiz.

---

## Priorização sugerida

| Prioridade | Item | Esforço |
|------------|------|---------|
| Alta | Corrigir "Karoot" → "Hootka" | Baixo |
| Alta | Mensagens de erro mais específicas | Médio |
| Alta | Dica de onde obter o código da sala | Baixo |
| Média | Header/navegação global | Médio |
| Média | Onboarding na home | Médio |
| Média | Empty state no catálogo de quizzes | Baixo |
| Média | Confirmação ao sair com alterações | Médio |
| Baixa | Filtros/ordenação no catálogo | Médio |
| Baixa | Tentativa anônima em quizzes globais | Alto |

---

## Métricas de UX

| Métrica | Estado atual |
|---------|--------------|
| Passos para entrar em sala | 3 (Home → Join → Código+Nome → Play) |
| Passos para criar sala (sem quiz) | 4+ (Home → Host → Create → Perguntas → Criar) |
| Feedback em erro | Toast + inline |
| Confirmação em exclusão | Sim |
| Navegação global | Não |
| Breadcrumb | Não |
| Empty states | Sim (host, quizzes) |
| Loading states | Sim (texto, botão desabilitado) |

---

## Próximos passos

1. Testes de usabilidade com 3–5 usuários reais
2. Implementar correções de prioridade alta
3. A/B testar onboarding (com vs sem)
4. Medir taxa de conclusão dos fluxos (analytics)
5. Coletar feedback qualitativo (NPS, satisfação)
