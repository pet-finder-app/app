/**
 * Entrega de um pet à ONG ("acolhimento"): o processo inverso da adoção. Quem
 * não pode mais ficar com o animal (ou o adotou pelo app e precisa devolver)
 * pede para deixá-lo com uma ONG: pedido → análise da ONG → termo de entrega
 * assinado eletronicamente → entrega → pet recebido. Mesmo esqueleto de
 * `lib/adoption.ts`, com a ONG no papel de quem recebe. Fica em
 * `surrenders.json`.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

import type { AdoptionEvent, AdoptionTerm, SignerRole } from "./adoption";
import type { UploadedFile } from "./ong";
import type {
  PetAgeGroup,
  PetHealth,
  PetSex,
  PetSize,
  PetSpecies,
} from "./pet";

export type SurrenderStatus =
  | "ficha"
  | "analise"
  | "termo"
  | "entrega"
  | "concluida"
  | "recusada"
  | "cancelada";

export const SURRENDER_STATUS_LABEL: Record<SurrenderStatus, string> = {
  ficha: "Ajustando o pedido",
  analise: "Em análise pela ONG",
  termo: "Assinatura do termo",
  entrega: "Combinando a entrega",
  concluida: "Pet recebido pela ONG",
  recusada: "Não aprovado",
  cancelada: "Cancelado",
};

/** Etapas do caminho feliz, na ordem, para a linha do tempo. */
export const SURRENDER_STEPS: { status: SurrenderStatus; label: string }[] = [
  { status: "ficha", label: "Pedido" },
  { status: "analise", label: "Análise" },
  { status: "termo", label: "Termo" },
  { status: "entrega", label: "Entrega" },
  { status: "concluida", label: "Concluído" },
];

export function isSurrenderActive(status: SurrenderStatus): boolean {
  return (
    status !== "concluida" && status !== "recusada" && status !== "cancelada"
  );
}

export type SurrenderReason =
  | "mudanca"
  | "alergia"
  | "saude"
  | "financeiro"
  | "comportamento"
  | "espaco"
  | "resgatado"
  | "outro";

export const SURRENDER_REASON_LABEL: Record<SurrenderReason, string> = {
  mudanca: "Mudança de casa ou de cidade",
  alergia: "Alergia na família",
  saude: "Problema de saúde meu ou de alguém da casa",
  financeiro: "Dificuldade financeira",
  comportamento: "Dificuldade com o comportamento do pet",
  espaco: "Falta de espaço ou de tempo",
  resgatado: "Encontrei o animal na rua e não posso ficar com ele",
  outro: "Outro motivo",
};

export const SURRENDER_REASON_KEYS = Object.keys(
  SURRENDER_REASON_LABEL,
) as SurrenderReason[];

export type SurrenderUrgency = "sem_pressa" | "algumas_semanas" | "urgente";

export const SURRENDER_URGENCY_LABEL: Record<SurrenderUrgency, string> = {
  sem_pressa: "Sem pressa",
  algumas_semanas: "Nas próximas semanas",
  urgente: "Urgente: preciso resolver em poucos dias",
};

export const SURRENDER_URGENCY_KEYS = Object.keys(
  SURRENDER_URGENCY_LABEL,
) as SurrenderUrgency[];

/** O animal que o adotante quer deixar com a ONG. */
export type SurrenderPet = {
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  size: PetSize;
  ageGroup: PetAgeGroup;
  health: PetHealth;
  /** Jeito do animal, rotina e história: vira a descrição do pet na ONG. */
  description: string;
  photos: UploadedFile[];
};

export type SurrenderForm = {
  reason: SurrenderReason;
  /** Conte com calma o que aconteceu. */
  reasonDetails: string;
  urgency: SurrenderUrgency;
  /** Convivência com crianças e outros animais; qualquer episódio de agressividade. */
  behavior: string;
  declaresOwnership: boolean;
  /** ISO datetime do envio. */
  submittedAt: string;
};

/** Encontro marcado pela ONG para receber o animal. */
export type SurrenderHandover = {
  place: string;
  /** ISO datetime. */
  at: string;
};

export type Surrender = {
  id: string;
  ongId: string;
  ongName: string;
  adopterId: string;
  adopterName: string;
  conversationId: string | null;
  status: SurrenderStatus;
  /** Pet que já é da ONG (devolução de um pet adotado pelo app). */
  petId: string | null;
  /** Adoção de origem, quando é uma devolução. */
  adoptionId: string | null;
  pet: SurrenderPet;
  form: SurrenderForm;
  /** Onde e quando o pet será levado à ONG. */
  handover: SurrenderHandover | null;
  /** Motivo da recusa/cancelamento ou pedido de ajustes. */
  decisionNote: string;
  term: AdoptionTerm | null;
  /** ISO datetime em que a ONG confirmou o recebimento. */
  receivedAt: string | null;
  /** Pet criado (ou reaberto) na ONG quando ela recebe o animal. */
  receivedPetId: string | null;
  events: AdoptionEvent[];
  createdAt: string;
  updatedAt: string;
};

export type SurrenderFormInput = Omit<SurrenderForm, "submittedAt">;

export function createEmptySurrenderPet(): SurrenderPet {
  return {
    name: "",
    species: "cachorro",
    breed: "",
    sex: "macho",
    size: "medio",
    ageGroup: "adulto",
    health: {
      vaccinated: false,
      neutered: false,
      dewormed: false,
      specialNeeds: "",
    },
    description: "",
    photos: [],
  };
}

export function createEmptySurrenderForm(): SurrenderFormInput {
  return {
    reason: "mudanca",
    reasonDetails: "",
    urgency: "algumas_semanas",
    behavior: "",
    declaresOwnership: false,
  };
}

/** Mensagem do primeiro campo que falta no pedido, ou null se tudo certo. */
export function validateSurrenderRequest(
  pet: SurrenderPet,
  form: SurrenderFormInput,
): string | null {
  if (!pet.name.trim()) return "Diga o nome do pet.";
  if (pet.photos.length === 0) {
    return "Adicione ao menos uma foto do pet para a ONG conhecê-lo.";
  }
  if (!pet.description.trim()) {
    return "Conte como é o pet: jeito, rotina e história.";
  }
  if (!form.reasonDetails.trim()) {
    return "Conte à ONG o que aconteceu. Ela vai ler com cuidado.";
  }
  if (!form.declaresOwnership) {
    return "Para seguir, confirme que você é o responsável pelo animal.";
  }
  return null;
}

/** Quem precisa agir agora (para destacar nas listas). */
export function whoActsNow(surrender: Surrender): SignerRole | null {
  switch (surrender.status) {
    case "ficha":
      return "adopter";
    case "analise":
    case "entrega":
      return "ong";
    case "termo": {
      const signed = surrender.term?.signatures.map((s) => s.role) ?? [];
      if (!signed.includes("ong")) return "ong";
      if (!signed.includes("adopter")) return "adopter";
      return null;
    }
    default:
      return null;
  }
}

/** Texto do lembrete quando o encontro é hoje ou amanhã; senão null. */
export function surrenderHandoverReminder(
  surrender: Surrender,
  now: Date = new Date(),
): string | null {
  const { handover } = surrender;
  if (!handover || surrender.status !== "entrega") return null;
  const at = new Date(handover.at);
  const diffH = (at.getTime() - now.getTime()) / 3_600_000;
  if (diffH < -3 || diffH > 24) return null;
  const hour = at.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (diffH < 0)
    return `O encontro estava marcado para ${hour}, em ${handover.place}.`;
  const sameDay = at.toDateString() === now.toDateString();
  return `Lembrete: encontro ${sameDay ? "hoje" : "amanhã"} às ${hour}, em ${handover.place}.`;
}

/** Versão segura para o navegador: nunca expõe códigos de confirmação pendentes. */
export function toClientSurrender(surrender: Surrender): Surrender {
  return surrender.term
    ? { ...surrender, term: { ...surrender.term, pendingCodes: {} } }
    : surrender;
}

/**
 * Modelo do termo de entrega. Variáveis entre chaves duplas são preenchidas
 * na hora de gerar o termo de cada pedido.
 *
 * ATENÇÃO: é um ponto de partida, não um parecer jurídico. Revise com um
 * advogado antes de usar (ver `docs/plano-processo-de-adocao.md`).
 */
export const SURRENDER_TERM_TEMPLATE = `TERMO DE ENTREGA VOLUNTÁRIA DE ANIMAL

Pelo presente termo, {{tutor.nome}}, CPF {{tutor.cpf}}, residente em {{tutor.endereco}}, doravante chamado TUTOR, entrega voluntariamente o animal abaixo a {{ong.nome}} ({{ong.documento}}), representada por {{ong.responsavel}}, doravante chamada ONG.

ANIMAL
Nome: {{pet.nome}}
Espécie: {{pet.especie}}
Raça: {{pet.raca}}
Sexo: {{pet.sexo}}
Porte: {{pet.porte}}
Idade: {{pet.idade}}
Saúde informada: {{pet.saude}}
Motivo da entrega: {{motivo}}

O TUTOR declara que leu e concorda com as cláusulas abaixo.

1. O TUTOR declara ser o legítimo responsável pelo animal e ter o direito de entregá-lo à ONG, e que o animal não pertence a outra pessoa.

2. O TUTOR declara que as informações sobre a saúde, o comportamento e a história do animal, inclusive doenças, mordidas ou qualquer episódio de agressividade, são verdadeiras e completas.

3. Com a entrega, a guarda e a responsabilidade pelo animal passam para a ONG, que poderá vaciná-lo, castrá-lo, tratá-lo e procurar um novo lar por meio de adoção responsável, com termo próprio.

4. A ONG não venderá o animal. A escolha do novo lar é da ONG, que poderá, se quiser, dar notícias ao TUTOR.

5. Depois da entrega, o TUTOR não poderá reaver o animal, salvo se a ONG concordar por escrito.

6. O TUTOR se compromete a entregar, junto com o animal, a carteirinha de vacinação, receitas, exames e qualquer outro documento ou medicamento que tenha, e pode contribuir com ração e outros itens se quiser.

7. A ONG poderá usar fotos e a história do animal para divulgar sua adoção, sem divulgar os dados pessoais do TUTOR.

8. Os dados pessoais do TUTOR serão usados apenas para este processo, conforme a Lei Geral de Proteção de Dados.

{{cidade}}, {{data}}.

Este termo é assinado eletronicamente pelas duas partes, dentro do aplicativo Petfinder.`;
