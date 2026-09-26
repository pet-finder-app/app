# Petfinder – guia para o Claude

App Next.js 16 (App Router, React 19, Tailwind 4, pnpm). Só front-end: os dados
ficam em `src/data/users.json` até o backend existir. Idioma do produto e dos
comentários: português.

**Prioridade mobile-first.** O app é usado majoritariamente no celular.
Toda tela nova ou alterada precisa ser conferida em 375px de largura antes
de considerar a tarefa concluída: sem rolagem horizontal, alvos de toque
confortáveis, texto legível sem zoom, e nada cortado ou sobreposto. Telas
maiores (tablet/desktop) só precisam continuar utilizáveis — o design é
pensado para mobile primeiro, depois adaptado para cima.

## Comandos

```sh
pnpm dev            # dev server em http://localhost:3000
pnpm lint           # eslint
npx tsc --noEmit    # tipos
npx prettier --write src
```

Rode lint, tipos e prettier antes de encerrar qualquer tarefa.

## UI System (obrigatório)

Todos os componentes visuais vêm de `src/components/ui` — leia
`src/components/ui/README.md` antes de mexer em qualquer tela.

**Mantenha este arquivo atualizado.** Sempre que o UI System mudar (tokens,
componentes, estilo visual, regra de acessibilidade), atualize esta seção
no mesmo commit/tarefa — nunca deixe o `CLAUDE.md` descrever um estado
antigo do sistema. O README dentro de `components/ui` tem o detalhe; aqui
fica o resumo que qualquer sessão precisa ler primeiro.

- **Não crie componentes novos** nem escreva classes de cor soltas nas telas.
  Falta uma variação? Adicione uma `variant`/`tone` ao componente existente.
- **Tokens** em `src/app/globals.css`: `primary` (green-500), `primary-hover`,
  `primary-soft`, `primary-faint`, `accent-yellow`, `accent-peach`, `line`
  (preto puro). Use `bg-primary`, `border-line` etc. Nunca hexadecimal direto.
- **Estilo: neo-brutalismo.** Borda preta grossa (`border-2 border-line`),
  sombra dura sem blur e deslocada — nunca `shadow-sm`/`shadow-md` do
  Tailwind, sempre `shadowBrutal.sm|md|lg|xl` de `components/ui/brutal.ts`
  (escala fina, ~1–3px, não exagere no deslocamento). Elementos clicáveis
  usam `pressBrutal` do mesmo tamanho, para "afundar" ao clicar. Cores
  chapadas e saturadas, nunca pastel lavado. Cantos: `rounded-full` em
  pílulas/selos, `rounded-lg` em botões/campos, `rounded-xl` em cartões.
  Nunca `backdrop-blur`.
- **Ícones:** sempre `lucide-react`, nunca emoji ou glifo Unicode solto
  (✓, ‹, +...). Tamanho vem de `iconSize.sm|md|lg` (`components/ui/icon.ts`).
- **Moldura:** toda página usa `PageShell`; cabeçalhos dentro de `Card`;
  ações fixas em `ActionBar`. Nada fica solto fora do quadro.
- **Telas de autenticação** usam `AuthLayout` (fundo verde), campos com
  `tone="primary"` e botão de envio `variant="secondary"`.
- **Voltar / trocar etapa:** `Button` ou `LinkButton` com `variant="pill"`.

## Melhorias de UX/UI

Sempre que notar uma oportunidade de melhorar UX ou UI (fluxo, hierarquia,
espaçamento, copy, estados vazios/erro, responsividade, acessibilidade),
proponha a melhoria de forma proativa, mesmo que fuja da tarefa pedida.
Regra: **informe o que mudaria e por quê, e peça autorização antes de
aplicar.** Nunca aplique a melhoria sem o "ok" explícito; entregue primeiro
a tarefa pedida e liste as sugestões ao final.

## Acessibilidade (WCAG 2.2 AA)

Campos com `label`, `hint` e `errorId`; `FormError` sempre montado; alvos de
toque ≥ 24px; foco visível; contraste 4.5:1; estado nunca só por cor; sem
rolagem horizontal em 375px. Verifique no preview em largura de celular.

## Domínio

- `src/lib/ong.ts`: modelo completo da ONG em seis camadas e o checklist do
  que falta para publicar o primeiro pet. `src/lib/br-documents.ts`: CPF/CNPJ.
- Cadastro da ONG é curto de propósito (tipo, nome, CPF/CNPJ, e-mail, senha,
  termos). O resto é preenchido em `/ong/perfil`.
- Usuários de teste: `contato@quatropatas.org` (verificada) e
  `bia@petfinder.app` (pendente), senha `123456`.
