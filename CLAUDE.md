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

  | Cor      | Primária      | Secundária    | Terciária   | Escura (só texto) |
  | -------- | ------------- | ------------- | ----------- | ----------------- |
  | Verde    | `lime-600`    | `lime-300`    | —           | `lime-800`        |
  | Amarelo  | `amber-400`   | `amber-200`   | —           | —                 |
  | Vermelho | `red-500`     | `red-400`     | —           | `red-700`         |
  | Rosa     | `rose-500`    | `rose-400`    | —           | —                 |
  | Azul     | `blue-600`    | `blue-400`    | —           | —                 |
  | Roxo     | `violet-600`  | `violet-500`  | —           | —                 |
  | Cinza    | `zinc-600`    | `gray-400`    | `stone-300` | —                 |
  | Preto    | `neutral-900` | `neutral-600` | —           | —                 |

  Verde e vermelho têm também uma cor **escura**, criada para acessibilidade:
  use em **texto pequeno** sobre fundo claro/pastel e em fundo com texto
  branco (as outras tonalidades não dão 4.5:1 de contraste nesses casos).
  Texto verde = `text-lime-800`; texto vermelho e botão de perigo (fundo com
  texto branco) = `red-700`.

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
- **Telas de autenticação** usam `AuthLayout`, campos com `tone="primary"`
  (borda `neutral-900`; `leading`/`trailing` para ícone e botão de senha) e
  envio `variant="dark"`. O login (`background="pastel"`) tem fundo verde-limão
  (mistura de `lime-200`/`lime-300`), manchas orgânicas nos cantos
  (`text-primary`, `text-lime-100`), marca d'água irregular
  (`public/logo-scatter.svg`), ilustração `PetfinderMark` com animações
  (`auth-float`, `auth-stamp`, `auth-paw-pulse`), `TextLink subtle` em
  "Esqueceu a senha?" e "CRIAR CONTA" em `variant="secondary"`. `Button` mostra
  spinner (`Loader2`) quando `loading`.
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
  termos). O resto é preenchido em `/ong/configuracoes`.
- `src/lib/pet.ts` + `src/lib/pets.ts`: modelo e storage dos pets publicados
  (`pets.json`). Só ONGs com `verification.status === "verificada"` podem
  cadastrar (`POST /api/ong/pets`) — ver `/ong/pets/novo`.
- `src/lib/post.ts` + `src/lib/posts.ts`: posts da ONG (estilo Instagram) em
  `posts.json`: legenda, várias fotos/vídeos (salvos em `public/uploads/posts`,
  ignorado no git) e o pet marcado (`petId`, opcional — pode cadastrar um pet
  novo direto no formulário). A grade do perfil lista posts, não pets; tocar
  abre `/ong/posts/[id]`; criar/editar em `/ong/posts/novo` e
  `/ong/posts/[id]/editar` (`PostForm`, `POST/PUT/DELETE /api/ong/posts`,
  multipart). Mídia nova usa `MediaInput` (UI System).
- `src/lib/notification.ts` + `src/lib/notifications.ts`: notificações da
  ONG sobre os pets (curtida = só demonstrou interesse passageiro; interesse
  = quer adotar de verdade). Geradas de verdade pelo lado do adotante
  (`toggleCurtida`/`createInteresse`) via `POST /api/pets/[id]/curtir` e
  `/interesse`; `Notification.adopterId` liga cada uma a um `StoredUser`.
- `src/lib/adopter.ts`: modelo do adotante em quatro camadas (identificação,
  moradia/rotina, preferências de adoção, termos/LGPD) e o checklist do que
  falta para o perfil ficar completo — mesmo padrão de `lib/ong.ts`. Cadastro
  do adotante é curto (nome, e-mail, senha, aceite dos termos); o resto é
  preenchido em `/adotante/perfil`.
- Painel da ONG (`/`) segue o padrão "perfil do Instagram sem stories":
  cabeçalho com avatar/nome/estatísticas/bio/"Editar perfil", grade de pets
  publicados abaixo. Navegação fixa (`OngTabBar`, com "+" central para novo post): início, cadastrar pet,
  notificações.
- Painel do adotante (`/`, quando `role === "adopter"`): cabeçalho compacto com
  avatar/nome/selo/passos do perfil e feed estilo Instagram em duas abas
  (`AdopterFeedTabs`): "Recomendações" (posts das ONGs + pets ainda sem post)
  e "Seguindo" (só ONGs seguidas; `lib/follows.ts`, `POST /api/ongs/[id]/seguir`,
  `FollowButton`). Cards de pet abrem `/pets/[id]` (detalhe). Navegação fixa
  (`AdopterTabBar`): início, favoritos (`/adotante/favoritos`), atividade
  (`/adotante/notificacoes`, histórico das próprias ações) e perfil. Ainda não
  há chat: o app avisa que a ONG responde por telefone/e-mail do perfil.
- Chat e adoção: `lib/conversation(s).ts` (uma conversa por pet + adotante, aberta
  pelo "Quero adotar"; telas `/adotante/conversas` e `/ong/mensagens`, com
  `ChatThread`, que consulta mensagens a cada 4s). `lib/adoption.ts` +
  `lib/adoptions.ts`: processo de adoção (ficha → análise/visita opcional →
  termo → entrega → acompanhamento 7/30/90 dias); toda mudança passa por
  `performAction` e avisa no chat. Termo: modelo por ONG
  (`lib/term-template.ts`, editor em `/ong/configuracoes/termo`), assinatura
  eletrônica própria com código (no protótipo o código aparece na tela; com
  backend sai por e-mail/SMS), SHA-256 e página imprimível em
  `/adocoes/[id]/termo`. Plano completo: `docs/plano-processo-de-adocao.md`.
- Requisitos do Notion (RF/RNF): `lib/dislikes.ts` + `POST /api/pets/[id]/descartar` ("Não tenho interesse": some do feed, lista em `/adotante/descartados`); `/adotante/descobrir` (`AdopterReels`, rolagem vertical com snap); feed e rolagem ordenam por proximidade usando o CEP do perfil (`distancesFromCep` em `lib/geo.ts`); `PetStatus` tem `indisponivel` (menu do pet da ONG, `PATCH /api/ong/pets/[id]` com `status`); pet tem `sizeCm` opcional e espécie `passaro`; recuperar senha em `/esqueci-senha` e `/redefinir-senha` (`lib/password-resets.ts`, link aparece na tela no protótipo); entrega com encontro marcado (`Adoption.handover`: local, data/hora, OTP do adotante, confirmação de entrega pela ONG e de recebimento pelo adotante; lembrete no painel quando o encontro é em até 24h). Também: localização do navegador opcional (`LocationButton`, `POST /api/location`, cookie; `lib/location.ts` escolhe GPS ou CEP), OTP da entrega opcional (checkbox ao marcar o encontro), `/ong/pets/[id]/interessados` (quem curtiu/quer adotar + `POST /api/ong/pets/[id]/conversar` para a ONG puxar assunto) e exclusão de conta (`DELETE /api/account`, `DeleteAccountButton`; adoções e conversas ficam por obrigação legal). Só existem os papéis ONG e adotante.
- Doação em dinheiro (adotante → ONG): `lib/donation.ts` + `lib/donations.ts`.
  O Pix acontece fora do app, direto na conta da ONG (chave em
  `publicProfile.donation`). O adotante escolhe a ONG em `/adotante/doar`
  (também pelo cartão da ONG em `/pets/[id]`), vê/copia a chave e toca em "Já
  fiz o Pix" (`POST /api/doacoes`) → doação `informada`. A ONG confere o extrato
  em `/ong/doacoes` e confirma ("Recebi o Pix") ou marca "não encontrei"
  (`POST /api/doacoes/[id]`). Só as `confirmada` (ou sem `status`, as de teste
  antigas) entram nos totais do dashboard.
- Entrega de pet à ONG ("acolhimento", o processo inverso da adoção):
  `lib/surrender.ts` + `lib/surrenders.ts`, `surrenders.json`. O adotante abre o
  pedido em `/adotante/acolhimentos/novo` (pet novo, ou devolução de um pet
  adotado pelo app, que traz os dados do pet e fixa a ONG de origem) → análise
  da ONG (`/ong/acolhimentos`; aceitar, pedir ajustes ou recusar com motivo) →
  termo de entrega (`SURRENDER_TERM_TEMPLATE`, mesma assinatura eletrônica da
  adoção, página `/acolhimentos/[id]/termo`) → ONG marca o encontro e confirma o
  recebimento. Ao receber, o pet entra no catálogo da ONG como "indisponível"
  (ou reabre o cadastro, na devolução) para ela avaliar e publicar; a adoção de
  origem vira `devolvida`. Mesmo esqueleto do painel de adoção (`SurrenderPanel`,
  peças comuns em `components/process-cards.tsx`); toda mudança passa por
  `performAction` e avisa no chat (conversa com `surrenderId`).
- Avisos de "tem algo para você": `lib/alerts.ts` (mensagens não lidas + adoções em que é a vez da pessoa), `GET /api/avisos` e `useAvisos` (selo no menu de baixo do adotante e da ONG, atualizado a cada 15s) e o cartão "Tem novidade para você" no Início do adotante. Erros das ações da adoção aparecem num aviso fixo perto da barra de baixo (`ErrorToast`), e atos sem volta pedem confirmação (`ConfirmButton`), ambos em `components/process-cards.tsx`. `Card` tem `tone` (default, highlight, success); não passe `bg-*` solto no `className`, ele não sobrescreve o fundo. Acompanhamento pós-adoção: um relato por vez, com foto opcional (`POST /api/adocoes/[id]/acompanhamento`, salva em `public/uploads/acompanhamento`).
- Usuários de teste: `contato@quatropatas.org` (ONG verificada, com pets),
  `bia@petfinder.app` (ONG pendente), `carla@petfinder.app` (adotante
  verificada, perfil completo) e `felipe@petfinder.app` (adotante pendente,
  perfil vazio) — senha `123456` para todos.
