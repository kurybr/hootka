---
name: hootka-ui
description: Aplica a identidade visual do Hootka (paleta, tipografia Nunito/Montserrat via Google Fonts, tokens Tailwind e shadcn). Use ao criar ou estilizar componentes, páginas, layouts, temas CSS, Tailwind, ou quando o usuário mencionar UI, design, cores, fontes ou branding do projeto.
---

# Hootka UI

Toda interface do Hootka deve seguir a identidade visual oficial. Não use paletas genéricas (roxo/branco, Inter, Roboto) nem invente cores fora dos tokens abaixo.

**Tipografia:** apenas fontes do [Google Fonts](https://fonts.google.com/) com licença open source (SIL Open Font License). Não usar `next/font/local` nem arquivos `.otf`/`.woff` proprietários no repositório.

## Paleta (hex oficial)

| Token | Hex | Uso típico |
|-------|-----|------------|
| `teal` | `#3F7B70` | Secundário, sucesso, destaque frio |
| `maroon` | `#8E2E1E` | Erro/destrutivo, ênfase escura |
| `orange` | `#D14B24` | Primário, CTAs, links de ação |
| `sand` | `#D9C491` | Fundos suaves, acentos claros |
| `charcoal` | `#4E443C` | Texto principal, superfícies escuras |

## Tipografia

| Papel | Família | Peso |
|-------|---------|------|
| Títulos | **Nunito** | Semibold/Bold/ExtraBold (`font-heading font-bold`) |
| Corpo | **Montserrat** | Regular/Medium/Bold (`font-sans`) |

- Títulos (`h1`–`h6`, `CardTitle`, hero): `font-heading font-bold`
- Corpo, labels, descrições: `font-sans` (padrão no `body`)
- Nunca substituir por Inter, Roboto ou system-ui como escolha estética principal
- Nunca adicionar fontes comerciais (Gotham, Ample Soft, etc.) sem pedido explícito

## Tokens no código

O tema vive em `src/app/globals.css` (variáveis shadcn + `--brand-*`) e `tailwind.config.ts`. Fontes em `src/app/layout.tsx` via `next/font/google`.

**Semântica shadcn (preferir em componentes):**

| Token Tailwind | Cor da marca |
|----------------|--------------|
| `primary` | orange |
| `secondary` | teal |
| `foreground` | charcoal |
| `background` | off-white com tom sand |
| `accent` / `muted` | sand e derivados |
| `destructive` | maroon |

**Tokens explícitos da marca** (quando precisar da cor exata):

- `bg-brand-teal`, `text-brand-orange`, `border-brand-sand`, etc.
- Variáveis CSS: `--brand-teal`, `--brand-maroon`, `--brand-orange`, `--brand-sand`, `--brand-charcoal`

## Checklist ao implementar UI

1. Usar classes semânticas (`bg-primary`, `text-foreground`, `text-muted-foreground`) antes de hex arbitrário
2. Títulos com `font-heading`; corpo com `font-sans`
3. Manter contraste legível (texto charcoal ou `primary-foreground` sobre fundos coloridos)
4. Bordas e inputs: `border-border` / `bg-background`
5. Não introduzir cores fora da paleta sem pedido explícito do usuário
6. Não commitar fontes locais proprietárias

## Relação com outras skills

- Para **identidade e tokens**: esta skill (`hootka-ui`) tem prioridade
- Para **direção criativa/layout ousado**: pode combinar com `frontend-design`, mas cores e fontes continuam sendo as da marca Hootka

## Referência

Valores HSL e mapeamento completo: [reference.md](reference.md)
