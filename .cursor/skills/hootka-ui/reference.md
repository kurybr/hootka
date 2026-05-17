# Hootka UI — referência técnica

## Cores (HSL para shadcn)

Valores usados em `globals.css` (`hsl(var(--token))`):

| Marca | Hex | HSL |
|-------|-----|-----|
| teal | `#3F7B70` | `169 32% 36%` |
| maroon | `#8E2E1E` | `9 65% 34%` |
| orange | `#D14B24` | `14 71% 48%` |
| sand | `#D9C491` | `43 49% 71%` |
| charcoal | `#4E443C` | `25 13% 27%` |

## Mapeamento shadcn (`:root`)

| Variável | Valor | Notas |
|----------|-------|-------|
| `--background` | `43 40% 97%` | Fundo claro com tom sand |
| `--foreground` | charcoal | Texto principal |
| `--primary` | orange | Botões e CTAs |
| `--primary-foreground` | `0 0% 100%` | Texto sobre primary |
| `--secondary` | teal | Ações secundárias |
| `--secondary-foreground` | `0 0% 100%` | Texto sobre secondary |
| `--muted` | `43 35% 92%` | Fundos discretos |
| `--muted-foreground` | `25 10% 40%` | Texto secundário |
| `--accent` | sand | Destaques suaves |
| `--accent-foreground` | charcoal | Texto sobre accent |
| `--destructive` | maroon | Erros |
| `--border` | `43 25% 85%` | Bordas |
| `--ring` | orange | Foco |

## Fontes (Google Fonts — SIL OFL)

| Papel | Família | Variável CSS | Pesos em `layout.tsx` |
|-------|---------|--------------|------------------------|
| Títulos | Nunito | `--font-heading` | 600, 700, 800 |
| Corpo | Montserrat | `--font-sans` | 400, 500, 700 |

Carregamento em `src/app/layout.tsx` com `next/font/google`. Não usar fontes locais proprietárias no repositório.

Referência de marca original (não usar no código): Ample Soft → Nunito; Gotham → Montserrat.

## Exemplos Tailwind

```tsx
<h1 className="font-heading text-4xl font-bold text-foreground">Título</h1>
<p className="font-sans text-muted-foreground">Texto de apoio</p>
<Button className="bg-primary text-primary-foreground">Jogar</Button>
<div className="rounded-lg border border-brand-sand/40 bg-brand-sand/20 p-4" />
```
