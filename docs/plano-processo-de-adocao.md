# Plano: processo de adoção dentro do app

Objetivo: tudo o que hoje a ONG faz no papel (ficha, entrevista, visita, termo
assinado, acompanhamento) passa a acontecer no Petfinder, com registro, prazo
e assinatura eletrônica, sem a ONG precisar sair do app nem imprimir nada.

> Este plano descreve o produto e a arquitetura. Os pontos jurídicos (validade
> da assinatura, cláusulas do termo) devem ser revisados por um advogado antes
> de ir para produção. O que está aqui é a visão técnica e de fluxo.

---

## 1. Como funciona uma adoção responsável (o que as ONGs fazem hoje)

1. **Interesse**: a pessoa vê o pet e conversa com a ONG (já existe: chat).
2. **Triagem**: a ONG avalia se o lar combina com o pet (moradia, rotina,
   outros animais, crianças, experiência). Hoje é um questionário no papel ou
   no WhatsApp.
3. **Entrevista / visita**: conversa ou visita domiciliar (fotos da casa, telas
   nas janelas, quintal).
4. **Aprovação**: a ONG decide aprovar, pedir ajustes ou recusar.
5. **Termo de adoção** (o "papel que se assina"): compromisso de cuidar, não
   vender, não abandonar, castrar (filhote), devolver à ONG se não puder ficar,
   aceitar acompanhamento.
6. **Entrega**: o adotante busca o pet; a ONG entrega com carteirinha de
   vacina e recibo.
7. **Pós-adoção**: a ONG pede fotos e notícias (ex.: 7, 30 e 90 dias) e confere
   a castração.
8. **Devolução** (se acontecer): termo de devolução e o pet volta a ficar
   disponível.

O app vira o "pasta digital" desse processo, uma por adoção.

---

## 2. Visão do fluxo no app

```
Conversa (chat)
   │  ONG toca "Iniciar adoção"
   ▼
1. Ficha do adotante ──► (usa o perfil que ele já preencheu + perguntas extras)
   ▼
2. Entrevista / visita ──► ONG agenda; adotante confirma; ONG registra resultado
   ▼
3. Decisão da ONG ──► Aprovado │ Pedir ajustes │ Recusado (com motivo)
   ▼  (aprovado)
4. Termo de adoção ──► gerado com os dados dos dois; ONG assina; adotante assina
   ▼
5. Entrega ──► ONG confirma a entrega; pet vira "Adotado"
   ▼
6. Pós-adoção ──► lembretes de 7, 30 e 90 dias com fotos e confirmação
   ▼
7. Concluída
```

Cada etapa é um **status** da adoção, visível aos dois lados como uma linha do
tempo (igual ao rastreio de uma entrega). A cada mudança, o chat recebe uma
**mensagem de sistema** ("A ONG enviou o termo para você assinar"), então a
conversa continua sendo o centro da relação.

### Status do pet (já existe) e da adoção (novo)

| Adoção (novo)          | Pet (já existe)                     |
| ---------------------- | ----------------------------------- |
| `triagem`              | `disponivel` (ainda não reserva)    |
| `entrevista`           | `em_processo` (a ONG reserva o pet) |
| `aprovada`             | `em_processo`                       |
| `aguardando_termo`     | `em_processo`                       |
| `assinada`             | `em_processo`                       |
| `entregue`             | `adotado`                           |
| `pos_adocao`           | `adotado`                           |
| `concluida`            | `adotado`                           |
| `recusada`/`cancelada` | volta para `disponivel`             |
| `devolvida`            | volta para `disponivel`             |

Vários interessados no mesmo pet: pode haver várias conversas, mas só **uma
adoção ativa** por pet. Ao iniciar uma, as outras conversas recebem um aviso
automático ("este pet está em processo de adoção com outra pessoa") e o pet
sai do feed.

---

## 3. Documentos

### 3.1 Documentos do processo

| Documento                    | Quem preenche           | Quando             |
| ---------------------------- | ----------------------- | ------------------ |
| Ficha de adoção (triagem)    | Adotante                | Etapa 1            |
| Autorização de visita        | Adotante                | Etapa 2            |
| Relatório de visita          | ONG (fotos + notas)     | Etapa 2            |
| **Termo de adoção**          | ONG gera; ambos assinam | Etapa 4            |
| Compromisso de castração     | Adotante (filhotes)     | Etapa 4 (no termo) |
| Recibo/protocolo de entrega  | ONG                     | Etapa 5            |
| Relatórios de acompanhamento | Adotante (fotos)        | Etapa 6            |
| Termo de devolução           | Ambos                   | Se houver          |

### 3.2 Modelos de termo configuráveis pela ONG

Cada ONG tem regras próprias, então o termo é um **modelo** (template) que a
ONG edita em `/ong/configuracoes`, com variáveis que o app preenche sozinho:

`{{pet.nome}}`, `{{pet.especie}}`, `{{pet.raca}}`, `{{pet.sexo}}`,
`{{pet.chip}}`, `{{adotante.nome}}`, `{{adotante.cpf}}`, `{{adotante.endereco}}`,
`{{ong.nome}}`, `{{ong.cnpj}}`, `{{ong.responsavel}}`, `{{data}}`, `{{cidade}}`.

O app oferece um **modelo padrão** já redigido (cláusulas comuns: responsabilidade
pelo bem-estar, proibição de venda/doação a terceiros, castração em prazo
definido, devolução à ONG, aceite de visitas e acompanhamento, foro). A ONG
pode aceitar o padrão ou editar. Cada versão do modelo é guardada: um termo
assinado sempre aponta para a versão exata que foi assinada.

### 3.3 Documento final

Ao fim das assinaturas o app gera um **PDF** com: o texto do termo, os dados
das partes, as assinaturas e uma **página de comprovação** (trilha de auditoria,
ver seção 4). Os dois lados podem baixar o PDF; ele fica guardado na pasta da
adoção.

---

## 4. Assinatura eletrônica

### 4.1 O que a lei permite (visão geral)

A Lei 14.063/2020 reconhece três níveis: **simples**, **avançada** e
**qualificada** (ICP-Brasil). Para contratos entre particulares, como um termo
de adoção, a assinatura simples ou avançada costuma ser aceita, desde que as
partes concordem em usá-la e haja prova de autoria e integridade. A
qualificada (certificado digital) não é necessária para esse tipo de termo.
**Confirmar com advogado.**

### 4.2 Recomendação por fases

**Fase 1 (MVP, feito dentro do app): assinatura avançada própria.**
Cada parte, para assinar:

1. Lê o termo na tela (rolagem até o fim antes de liberar o botão).
2. Confirma identidade: está logada + digita o CPF + recebe um **código de 6
   dígitos por e-mail/SMS** (a verificação de telefone/e-mail já existe como
   campo no perfil, falta o envio).
3. Marca "li e concordo" e toca em **Assinar**.
4. O app registra: nome, CPF, data/hora (UTC), IP, navegador, código usado, e
   um **hash SHA-256** do PDF no momento da assinatura.
5. Depois da última assinatura, o PDF final é "selado" (hash final guardado).
   Qualquer alteração depois invalida a conferência do hash.

Opcional na Fase 1: o adotante envia **foto do documento + selfie** na triagem
(o perfil já pede foto do documento), e o app mostra as duas imagens para a ONG
conferir. Isso reforça a prova de identidade.

**Fase 2: integrar um provedor de assinatura** (Clicksign, D4Sign, ZapSign ou
assinatura avançada do gov.br). Vantagem: validade jurídica mais robusta e
selo de terceiros; custo por documento. A arquitetura da Fase 1 já deixa um
"adaptador de assinatura" que pode ser trocado sem refazer as telas.

### 4.3 Trilha de auditoria (página de comprovação do PDF)

Linha do tempo de tudo o que aconteceu: termo gerado, enviado, visualizado,
código enviado, assinado por A, assinado por B, hash final, versão do modelo.

---

## 5. Telas

### Adotante

- **Conversas** (já existe): mostra, no topo do chat, um **cartão de status**
  da adoção ("Etapa 2 de 6: Entrevista") com botão da próxima ação.
- **Minha adoção** (`/adotante/adocoes/[id]`): linha do tempo vertical com as
  etapas, o que já foi feito, o que falta e o prazo.
  - Etapa Ficha: formulário curto, já preenchido com o perfil.
  - Etapa Visita: escolhe um horário entre os que a ONG ofereceu (ou
    "visita por vídeo" como alternativa).
  - Etapa Termo: **lê, confirma o código e assina** (tela dedicada, texto
    grande, botão "Assinar" só ativo ao final da leitura).
  - Etapa Pós-adoção: cartão "Mande uma foto do Biscoito" com envio de foto +
    campo "como ele está?".
- **Minhas adoções** na aba Atividade: lista de adoções ativas e concluídas
  com os PDFs.

### ONG

- **Painel de adoções** (`/ong/adocoes`): quadro por etapa (Triagem,
  Entrevista, Termo, Entrega, Pós-adoção) com cartões por pet/adotante e
  indicador de "ação sua pendente".
- **Detalhe da adoção** (`/ong/adocoes/[id]`): perfil do adotante (com selo de
  verificado), respostas da ficha, documentos, histórico, e botões de ação da
  etapa: aprovar, pedir ajustes, recusar (com motivo obrigatório e mensagem
  educada pronta), gerar termo, assinar, confirmar entrega.
- **Modelos de documentos** (`/ong/configuracoes/documentos`): editar o termo
  e a ficha, pré-visualizar com dados de exemplo.
- **Agenda de visitas**: lista simples de horários oferecidos e confirmados.

### Notificações e lembretes

Mensagem no chat + item em Atividade/Notificações + (quando houver backend)
e-mail/push. Lembretes: termo parado há 3 dias, visita amanhã, relatório de
30 dias chegando.

---

## 6. Modelo de dados (resumo)

Mesmo padrão do projeto: tipos em `lib/*.ts` (sem Node), acesso a dados em
`lib/*s.ts` (JSON hoje, backend depois).

- `Adoption`: `id`, `petId`, `ongId`, `adopterId`, `conversationId`, `status`,
  `timeline[]` (evento, autor, data), `decision` (aprovada/recusada + motivo),
  `visit` (data, tipo, notas, fotos), `termId`, `createdAt/updatedAt`.
- `AdoptionForm`: respostas da ficha (snapshot do perfil + perguntas extras),
  para o histórico não mudar se o adotante editar o perfil depois.
- `DocumentTemplate`: `ongId`, `type` (termo/ficha/devolução), `title`,
  `body` (com variáveis), `version`, `active`.
- `SignedDocument`: `adoptionId`, `templateVersion`, texto renderizado, `pdfUrl`,
  `hashFinal`, `signatures[]` { `userId`, `role`, `name`, `cpf`, `signedAt`,
  `ip`, `userAgent`, `codeMethod`, `hashAtSigning` }, `events[]` (trilha).
- `FollowUp`: `adoptionId`, `dueAt`, `kind` (7d/30d/90d), `photo`, `note`,
  `receivedAt`.
- Mensagens de sistema no chat: `ChatMessage` ganha `kind: "text" | "system"` e
  um `adoptionEvent` opcional.

---

## 7. Regras importantes

- **Permissões**: só a ONG dona do pet cria/aprova/recusa; só as partes veem os
  documentos; o adotante só assina o próprio termo.
- **Reserva do pet**: iniciar a adoção reserva o pet; cancelar/recusar libera.
- **Prazos**: cada etapa tem prazo sugerido; se estourar, lembrete e, depois de
  X dias, a ONG pode cancelar com um clique.
- **Recusa**: motivo obrigatório (lista + texto) e mensagem respeitosa; o
  adotante pode continuar adotando outros pets.
- **Termo imutável**: depois de assinado por uma parte, o texto não muda; para
  alterar, cancela e gera nova versão.
- **Devolução**: botão "Devolver pet" no pós-adoção gera termo de devolução; o
  pet volta ao feed com um histórico interno.
- **LGPD**: coletar só o necessário; documentos pessoais visíveis só à ONG
  envolvida; baixar/apagar sob pedido; prazo de retenção definido; aviso claro
  de para quê cada dado é usado.

---

## 8. Fases de implementação sugeridas

1. **Fundação**: modelo `Adoption` + status + painel simples da ONG + cartão de
   status no chat + mensagens de sistema. (Sem documentos ainda.)
2. **Ficha e decisão**: ficha do adotante, aprovar/pedir ajustes/recusar,
   reserva do pet, fila de interessados.
3. **Termo**: modelos editáveis + modelo padrão + geração do PDF.
4. **Assinatura**: leitura obrigatória, código por e-mail/SMS, trilha de
   auditoria, hash, PDF selado. (Envio de e-mail/SMS exige backend ou
   serviço; no protótipo local o código aparece num "e-mail de teste" na tela.)
5. **Entrega e pós-adoção**: confirmação de entrega, lembretes, relatórios com
   foto, conclusão.
6. **Visita**: agenda, relatório com fotos.
7. **Evolução**: provedor de assinatura externo, notificações push/e-mail,
   devolução, relatórios para a ONG (taxa de adoção, tempo médio, devoluções).

Dá para entregar valor já na fase 3-4 (termo assinado dentro do app), que é o
coração do pedido.

### Dependências técnicas

- **PDF**: biblioteca de geração no servidor (por exemplo `pdf-lib` ou
  renderização HTML→PDF).
- **Arquivos**: fotos e PDFs em `public/uploads` hoje; storage de verdade
  (S3 ou similar) com URL assinada quando houver backend.
- **Código de verificação**: e-mail (Resend/SES) ou SMS/WhatsApp (Twilio,
  Zenvia). No protótipo, simulado.
- **Tempo real**: o chat busca mensagens a cada poucos segundos; com backend,
  trocar por WebSocket.

---

## 9. Decisões que precisam de você

1. **Assinatura**: começamos com a assinatura própria do app (mais simples, sem
   custo por documento) ou já integramos um provedor (mais segurança jurídica,
   custo por assinatura)?
2. **Visita domiciliar**: é obrigatória em todas as adoções ou a ONG escolhe
   por adoção?
3. **Modelo de termo**: cada ONG escreve o seu, ou o app impõe um modelo único
   (com poucas cláusulas editáveis)? Você tem um termo de adoção real de uma
   ONG para usarmos como base?
4. **Taxa de adoção**: ONGs costumam cobrar uma taxa/ressarcimento. O app deve
   registrar isso (e pagar dentro do app) ou fica fora do escopo?
5. **Acompanhamento pós-adoção**: quais prazos (7/30/90 dias?) e é obrigatório
   para o adotante responder?
6. **Quem pode iniciar a adoção**: só a ONG (recomendado) ou o adotante também
   pode "pedir para iniciar" depois do chat?

## 10. Riscos

- **Validade jurídica**: depende de cláusulas e do nível de assinatura; revisar
  com advogado antes de lançar.
- **Dados sensíveis** (CPF, documentos, endereço): exigem backend seguro,
  criptografia e controle de acesso; o armazenamento atual em JSON local serve
  só para protótipo.
- **Fricção**: processo longo demais afasta adotantes e ONGs pequenas. Por isso
  o fluxo deve permitir pular etapas opcionais e reaproveitar o perfil.
- **Golpes**: falsos adotantes e ONGs falsas. Mitigação: verificação das duas
  partes (já existe), aviso "nunca faça pagamentos fora do app" no chat.

---

## 11. Fluxos que completam o processo (implementados no protótipo)

### 11.1 Doação em dinheiro do adotante para a ONG

Responde à decisão 4 (taxa/doação) só para **doações voluntárias**; taxa de
adoção continua fora do app. O dinheiro nunca passa pelo Petfinder: é Pix direto
para a chave da ONG. O app guarda o registro e a confirmação.

```
Adotante: escolhe ONG → valor → copia a chave Pix → paga no banco
   ▼  "Já fiz o Pix"
Doação "informada"  ──► ONG confere o extrato
   ▼                      ├─ "Recebi o Pix"  → confirmada (entra nos totais)
                          └─ "Não encontrei" → não localizada
```

Riscos tratados: aviso de golpe na tela de doar ("só use os dados desta tela"),
totais só com doações confirmadas pela ONG, opção de doar sem aparecer o nome.
Com backend: trocar a confirmação manual por conciliação via Pix (webhook do
PSP) e gerar o QR Code.

### 11.2 Adotante deixa (ou devolve) um pet com a ONG

O processo inverso da adoção, com os mesmos blocos:

| Adoção                            | Entrega do pet à ONG                     |
| --------------------------------- | ---------------------------------------- |
| ONG inicia pelo chat              | **Adotante** abre o pedido               |
| Ficha do adotante                 | Pedido: dados do pet, motivo, urgência   |
| Análise (aprovar/ajustes/recusar) | Análise da ONG (aceitar/ajustes/recusar) |
| Termo de adoção                   | Termo de entrega voluntária              |
| Entrega: ONG → adotante           | Entrega: adotante → ONG (ONG confirma)   |
| Pet vira "Adotado"                | Pet entra na ONG como "Indisponível"     |

- **Devolução** (pet adotado pelo app): a ONG é a de origem, os dados do pet vêm
  do cadastro dela e a adoção passa a `devolvida` (encerra o acompanhamento).
- **Pet de fora**: o cadastro nasce do pedido (nome, espécie, saúde, fotos) e a
  ONG revisa antes de publicar.
- **Pendências**: o termo de entrega (`SURRENDER_TERM_TEMPLATE`) é um rascunho e
  precisa de revisão jurídica (guarda, não reaver o animal, LGPD); a ONG ainda não
  pode editá-lo como faz com o termo de adoção.
