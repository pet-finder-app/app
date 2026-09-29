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
- **Paleta fechada (obrigatória):** só estas cores no projeto. Primária
  quando precisar de cor viva/destacada; secundária para o que tem pouco
  destaque. Nenhuma outra classe de cor do Tailwind. **Exceção:** cores de
  fundo (`bg-*`, pastéis dos tokens) continuam as de antes.

  | Cor      | Primária      | Secundária    | Terciária   |
  | -------- | ------------- | ------------- | ----------- |
  | Verde    | `lime-600`    | `lime-300`    | —           |
  | Amarelo  | `amber-400`   | `amber-200`   | —           |
  | Vermelho | `red-500`     | `red-400`     | —           |
  | Rosa     | `rose-500`    | `rose-400`    | —           |
  | Azul     | `blue-600`    | `blue-400`    | —           |
  | Roxo     | `violet-600`  | `violet-500`  | —           |
  | Cinza    | `zinc-600`    | `gray-400`    | `stone-300` |
  | Preto    | `neutral-900` | `neutral-600` | —           |

- **Tokens** em `src/app/globals.css`: `primary` (lime-600), `primary-hover`,
  `primary-soft`, `primary-faint`, `accent-yellow`, `accent-peach`, `line`
  (stone-300, só para divisores sutis). Use `bg-primary` etc. Nunca
  hexadecimal direto.
- **Estilo: soft UI.** Cantos bem arredondados, sombra suave e difusa em
  vez de borda grossa — sempre `shadowSoft.sm|md|lg|xl` de
  `components/ui/elevation.ts`, nunca `shadow-sm`/`shadow-md` do Tailwind
  soltos. Elementos clicáveis usam `pressSoft` do mesmo tamanho (encolhe
  levemente ao clicar, sem deslocar). A maioria das superfícies não tem
  borda — a sombra já contorna; quando precisar de uma (campo, item sobre
  fundo branco), é fina (`border border-stone-300`), nunca `border-2`.
  Cores pastel. Cantos: `rounded-full` em pílulas/selos/avatares,
  `rounded-2xl` em botões/campos/itens de lista, `rounded-3xl` em cartões.
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
- `src/lib/pet.ts` + `src/lib/pets.ts`: modelo e storage dos pets publicados
  (`pets.json`). Só ONGs com `verification.status === "verificada"` podem
  cadastrar (`POST /api/ong/pets`) — ver `/ong/pets/novo`.
- `src/lib/notification.ts` + `src/lib/notifications.ts`: notificações da
  ONG sobre os pets (curtida = só demonstrou interesse passageiro; interesse
  = quer adotar de verdade). Geradas de verdade pelo lado do adotante
  (`toggleCurtida`/`createInteresse`) via `POST /api/pets/[id]/curtir` e
  `/interesse`; `Notification.adopterId` liga cada uma a um `StoredUser`.
- `src/lib/adopter.ts`: modelo do adotante em quatro camadas (identificação,
  moradia/rotina, preferências de adoção, termos/LGPD) e o checklist do que
  falta para o perfil ficar completo — mesmo padrão de `lib/ong.ts`. Cadastro
  do adotante é curto (nome, e-mail, senha); o resto é preenchido em
  `/adotante/perfil`, inclusive o aceite dos termos (não é pedido no
  cadastro).
- Painel da ONG (`/`) segue o padrão "perfil do Instagram sem stories":
  cabeçalho com avatar/nome/estatísticas/bio/"Editar perfil", grade de pets
  publicados abaixo. Navegação fixa (`OngTabBar`): início, cadastrar pet,
  notificações.
- Painel do adotante (`/`, quando `role === "adopter"`): cabeçalho com
  avatar/nome/selo de verificação/checklist do perfil, feed de pets
  disponíveis de ONGs verificadas (`listAvailablePets`) com curtir/demonstrar
  interesse (`AdopterPetCard`). Navegação fixa (`AdopterTabBar`): início,
  notificações (atividade própria, em `/adotante/notificacoes`), perfil.
- Usuários de teste: `contato@quatropatas.org` (ONG verificada, com pets),
  `bia@petfinder.app` (ONG pendente), `carla@petfinder.app` (adotante
  verificada, perfil completo) e `felipe@petfinder.app` (adotante pendente,
  perfil vazio) — senha `123456` para todos.
