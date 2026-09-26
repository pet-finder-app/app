# UI System

Componentes base do Petfinder. **Antes de criar um componente novo, procure aqui.**
Se precisar de uma variação, adicione uma `variant`/`tone` ao componente existente
em vez de copiar classes para a tela.

```tsx
import { Button, Input, Card } from "@/components/ui";
```

## Estilo: soft UI

Linguagem visual do UI System inteiro: cantos bem arredondados, sombra
suave e difusa em vez de borda grossa (a superfície "flutua", não é
contornada), cores pastel, e um leve encolhimento no clique — nunca
deslocamento.

- `shadowSoft.sm | md | lg | xl` e `pressSoft.sm | md | lg | xl`
  (`components/ui/elevation.ts`) — use sempre a mesma chave nos dois.
- Escala de sombra por hierarquia: badge/chip = sem sombra (só cor pastel),
  botão = por `size`, cartão = `lg`.
- Cantos: `rounded-full` em pílulas/selos/avatares, `rounded-2xl` em
  botões/campos/itens de lista, `rounded-3xl` em cartões. Nunca sem raspa
  (`rounded-none`).
- Borda: a maioria das superfícies não tem borda (a sombra já contorna).
  Quando precisar de uma (campo, item de lista sobre fundo branco), é
  sempre fina — `border border-neutral-200` — nunca `border-2`.
- Nunca use `backdrop-blur`.
- Novo componente? Reaproveite `shadowSoft`/`pressSoft` em vez de
  escrever uma sombra solta.

```tsx
import { Button, shadowSoft } from "@/components/ui";
import { cn } from "@/components/ui";

<div className={cn("rounded-3xl bg-white p-4", shadowSoft.lg)}>...</div>;
```

## Tokens (globals.css)

| Token                | Valor                   | Uso                                                 |
| -------------------- | ----------------------- | --------------------------------------------------- |
| `primary`            | green-500 (`#22c55e`)   | Botão principal, foco, progresso, destaques         |
| `primary-hover`      | green-600 (`#16a34a`)   | Hover do primário                                   |
| `primary-foreground` | neutral-900             | Texto sobre o primário                              |
| `primary-soft`       | green-100               | Fundo suave de itens ativos/selecionados            |
| `primary-faint`      | green-50                | Hover de superfícies brancas, selos informativos    |
| `accent-yellow`      | `#fdecc8`               | Pastel: botão secundário, caixas de informação      |
| `accent-peach`       | `#fde1d3`               | Pastel: avisos e selos de perigo                    |
| `line`               | `#e5e7eb` (neutral-200) | Divisor sutil (`border-y`, `border-t` entre seções) |

## Estilo

Visual "soft UI": superfícies brancas **sem contorno**, elevadas por sombra
suave (`shadowSoft`), cantos bem arredondados, e preenchimentos pastel para
dar cor. O verde primário entra só onde há ação ou estado ativo.

Use as classes `bg-primary`, `text-primary`, `ring-primary`, `hover:bg-primary-hover`.
Não use cores hexadecimais nem `neutral-400` direto para significar "primário":
se a cor mudar, muda só em `globals.css`.

## Tone

Campos, checkbox e links aceitam `tone="primary" | "light"`:

- `primary`: telas de autenticação (fundo no verde primário). Rótulos escuros; o botão de envio usa `variant="secondary"` para se destacar do fundo.
- `light` (padrão): resto do app, fundo `neutral-100` com cartões brancos.

## Componentes

| Componente                             | Para quê                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                               | `variant`: primary, secondary (amarelo pastel), outline, pill (voltar/trocar etapa, igual ao selo), danger. `size`: sm, md, lg (lg = largura total). `loading` + `loadingLabel` para envio. |
| `LinkButton`                           | Mesmo visual do `Button`, mas é um `<Link>`.                                                                                                                                                |
| `TextLink`                             | Link inline sublinhado.                                                                                                                                                                     |
| `Input`, `Select`, `Textarea`          | Campos com rótulo, dica e erro acessíveis. Sempre passe `id` e `label`.                                                                                                                     |
| `Checkbox`                             | Caixa com rótulo (o rótulo pode conter links).                                                                                                                                              |
| `FileInput`                            | Escolha de um arquivo; guarda só metadados (`UploadedFile`).                                                                                                                                |
| `PhotoInput`                           | Escolha de várias fotos (`UploadedFile[]`), com miniatura em lista e remoção individual. Mesma ideia do `FileInput`, para quando há mais de um arquivo (fotos do pet, do perfil público).   |
| `FormError`                            | Alerta de erro do formulário; use o `id` dele como `errorId` dos campos.                                                                                                                    |
| `Card`, `CardTitle`, `CardDescription` | Cartão branco padrão.                                                                                                                                                                       |
| `Badge`                                | Selo: neutral, info, success, warning, danger.                                                                                                                                              |
| `Progress`                             | Barra de progresso.                                                                                                                                                                         |
| `Field`, `useFieldA11y`, `cn`          | Blocos para montar campos novos com a mesma base.                                                                                                                                           |

## Padrão de formulário

```tsx
const ERROR_ID = "login-error";

<form className="flex flex-col gap-4">
  <Input
    id="email"
    label="E-mail"
    type="email"
    tone="primary"
    invalid={errorField === "email"}
    errorId={ERROR_ID}
  />
  <FormError id={ERROR_ID}>{error}</FormError>
  <Button
    type="submit"
    size="lg"
    loading={isSubmitting}
    variant="secondary"
    loadingLabel="ENTRANDO..."
  >
    ENTRAR
  </Button>
</form>;
```

## Moldura de página

Toda tela usa `PageShell` (fundo, gutter de 16px, conteúdo centralizado em
`max-w-lg`). Cabeçalhos também ficam dentro de um `Card` — nada fica solto
fora do quadro. Formulários com ações fixas usam `ActionBar`, que alinha com
a mesma largura e respeita a área segura do celular.

## Ícones

Todos os ícones vêm de `lucide-react` — nunca emoji, nunca glifo Unicode
solto (✓, ‹, +...). Importe direto onde for usar:

```tsx
import { iconSize } from "@/components/ui";
import { ChevronLeft } from "lucide-react";

<Button variant="pill" size="sm">
  <ChevronLeft className={iconSize.sm} aria-hidden="true" />
  Voltar
</Button>;
```

- Tamanho vem de `iconSize.sm | md | lg` (ver `components/ui/icon.ts`), nunca
  um número escolhido na hora.
- Ícone ao lado de texto que já diz a mesma coisa: `aria-hidden="true"`.
- Ícone como único conteúdo de um controle: o controle precisa de
  `aria-label`.
- Estado (concluído, verificado...) nunca é só o ícone: sempre acompanhado
  de texto visível ou `sr-only`.

## Acessibilidade (WCAG 2.2 AA)

- Todo campo tem `<label>` associado, dica via `aria-describedby` e erro via
  `aria-invalid` + `FormError` (`role="alert"`, sempre montado).
- Alvos de toque com no mínimo 24px (`Button` sm = 28px, md = 44px, checkbox = 24px).
- Foco visível em tudo que é interativo (`focus-visible:ring-2`).
- Contraste mínimo 4.5:1: texto `neutral-800`/`900` sobre branco, pastel ou verde;
  `neutral-500` só em dicas sobre branco. Nunca texto branco sobre o verde primário.
- Ícones decorativos com `aria-hidden`; estado transmitido também em texto
  (ex.: "(concluída)" em `sr-only`), nunca só por cor.
- Botões de ícone ou repetidos ("Remover") recebem `aria-label` específico.
- Sem rolagem horizontal em 375px; layouts em `grid`/`flex-wrap` que quebram.

## Componentes de domínio

Ficam em `src/components/` (fora de `ui/`) e são compostos com o UI System:
`auth-layout`, `role-select`, `verification-badge`, `splash-*`, `ong-tab-bar`
(navegação fixa do painel da ONG — início/grade de pets, cadastrar, notificações).
