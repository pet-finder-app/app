/** Client-safe surrender/return process model, from request through NGO review, signed agreement, and confirmed intake. Mirrors adoption with the NGO as recipient; persisted in surrenders.json. */

import type { AdoptionEvent, AdoptionTerm, SignerRole } from "./adoption";
import type { UploadedFile } from "./ngo";
import type {
  PetAgeGroup,
  PetHealth,
  PetSex,
  PetSize,
  PetSpecies,
} from "./pet";

export type SurrenderStatus =
  | "application"
  | "review"
  | "agreement"
  | "handover"
  | "completed"
  | "rejected"
  | "cancelled";

export const SURRENDER_STATUS_LABEL: Record<SurrenderStatus, string> = {
  application: "Ajustando o pedido",
  review: "Em análise pela ONG",
  agreement: "Assinatura do termo",
  handover: "Combinando a entrega",
  completed: "Pet recebido pela ONG",
  rejected: "Não aprovado",
  cancelled: "Cancelado",
};

/** Ordered successful-process stages for the timeline. */
export const SURRENDER_STEPS: { status: SurrenderStatus; label: string }[] = [
  { status: "application", label: "Pedido" },
  { status: "review", label: "Análise" },
  { status: "agreement", label: "Termo" },
  { status: "handover", label: "Entrega" },
  { status: "completed", label: "Concluído" },
];

export function isSurrenderActive(status: SurrenderStatus): boolean {
  return (
    status !== "completed" && status !== "rejected" && status !== "cancelled"
  );
}

export type SurrenderReason =
  | "moving"
  | "allergy"
  | "health"
  | "financial"
  | "behavior"
  | "space"
  | "rescued"
  | "other";

export const SURRENDER_REASON_LABEL: Record<SurrenderReason, string> = {
  moving: "Mudança de casa ou de cidade",
  allergy: "Alergia na família",
  health: "Problema de saúde meu ou de alguém da casa",
  financial: "Dificuldade financeira",
  behavior: "Dificuldade com o comportamento do pet",
  space: "Falta de espaço ou de tempo",
  rescued: "Encontrei o animal na rua e não posso ficar com ele",
  other: "Outro motivo",
};

export const SURRENDER_REASON_KEYS = Object.keys(
  SURRENDER_REASON_LABEL,
) as SurrenderReason[];

export type SurrenderUrgency = "no_rush" | "few_weeks" | "urgent";

export const SURRENDER_URGENCY_LABEL: Record<SurrenderUrgency, string> = {
  no_rush: "Sem pressa",
  few_weeks: "Nas próximas semanas",
  urgent: "Urgente: preciso resolver em poucos dias",
};

export const SURRENDER_URGENCY_KEYS = Object.keys(
  SURRENDER_URGENCY_LABEL,
) as SurrenderUrgency[];

/** The pet the guardian wishes to surrender to an NGO. */
export type SurrenderPet = {
  name: string;
  species: PetSpecies;
  breed: string;
  sex: PetSex;
  size: PetSize;
  ageGroup: PetAgeGroup;
  health: PetHealth;
  /** Pet behavior, routine, and history used as its organization profile description. */
  description: string;
  photos: UploadedFile[];
};

export type SurrenderForm = {
  reason: SurrenderReason;
  /** Detailed explanation of the surrender circumstances. */
  reasonDetails: string;
  urgency: SurrenderUrgency;
  /** Behavior around children and other animals, including any aggression history. */
  behavior: string;
  declaresOwnership: boolean;
  /** ISO submission timestamp. */
  submittedAt: string;
};

/** NGO-scheduled intake meeting. */
export type SurrenderHandover = {
  place: string;
  /** ISO timestamp. */
  at: string;
};

export type Surrender = {
  id: string;
  ngoId: string;
  ngoName: string;
  adopterId: string;
  adopterName: string;
  conversationId: string | null;
  status: SurrenderStatus;
  /** Existing NGO pet being returned after an adoption. */
  petId: string | null;
  /** Original adoption identifier when this request is a return. */
  adoptionId: string | null;
  pet: SurrenderPet;
  form: SurrenderForm;
  /** Location and time for bringing the pet to the NGO. */
  handover: SurrenderHandover | null;
  /** Explanation for rejection, cancellation, or requested changes. */
  decisionNote: string;
  term: AdoptionTerm | null;
  /** ISO timestamp when the NGO confirmed receipt. */
  receivedAt: string | null;
  /** Pet record created or reopened when the NGO receives the animal. */
  receivedPetId: string | null;
  events: AdoptionEvent[];
  createdAt: string;
  updatedAt: string;
};

export type SurrenderFormInput = Omit<SurrenderForm, "submittedAt">;

export function createEmptySurrenderPet(): SurrenderPet {
  return {
    name: "",
    species: "dog",
    breed: "",
    sex: "male",
    size: "medium",
    ageGroup: "adult",
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
    reason: "moving",
    reasonDetails: "",
    urgency: "few_weeks",
    behavior: "",
    declaresOwnership: false,
  };
}

/** First missing surrender-request-field error, or null when valid. */
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

/** Participant who must act next, for list highlighting. */
export function whoActsNow(surrender: Surrender): SignerRole | null {
  switch (surrender.status) {
    case "application":
      return "adopter";
    case "review":
    case "handover":
      return "ngo";
    case "agreement": {
      const signed = surrender.term?.signatures.map((s) => s.role) ?? [];
      if (!signed.includes("ngo")) return "ngo";
      if (!signed.includes("adopter")) return "adopter";
      return null;
    }
    default:
      return null;
  }
}

/** Handover reminder for today or tomorrow; otherwise null. */
export function surrenderHandoverReminder(
  surrender: Surrender,
  now: Date = new Date(),
): string | null {
  const { handover } = surrender;
  if (!handover || surrender.status !== "handover") return null;
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

/** Browser-safe projection that never exposes pending signing codes. */
export function toClientSurrender(surrender: Surrender): Surrender {
  return surrender.term
    ? { ...surrender, term: { ...surrender.term, pendingCodes: {} } }
    : surrender;
}

/** Default surrender-agreement template. Double-braced variables are populated per request. This starting template requires legal review before production use. */
export const SURRENDER_TERM_TEMPLATE = `TERMO DE ENTREGA VOLUNTÁRIA DE ANIMAL

Pelo presente termo, {{guardian.name}}, CPF {{guardian.personalTaxId}}, residente em {{guardian.address}}, doravante chamado TUTOR, entrega voluntariamente o animal abaixo a {{ngo.name}} ({{ngo.document}}), representada por {{ngo.representative}}, doravante chamada ONG.

ANIMAL
Nome: {{pet.name}}
Espécie: {{pet.species}}
Raça: {{pet.breed}}
Sexo: {{pet.sex}}
Porte: {{pet.size}}
Idade: {{pet.age}}
Saúde informada: {{pet.health}}
Motivo da entrega: {{reason}}

O TUTOR declara que leu e concorda com as cláusulas abaixo.

1. O TUTOR declara ser o legítimo responsável pelo animal e ter o direito de entregá-lo à ONG, e que o animal não pertence a outra pessoa.

2. O TUTOR declara que as informações sobre a saúde, o comportamento e a história do animal, inclusive doenças, mordidas ou qualquer episódio de agressividade, são verdadeiras e completas.

3. Com a entrega, a guarda e a responsabilidade pelo animal passam para a ONG, que poderá vaciná-lo, castrá-lo, tratá-lo e procurar um novo lar por meio de adoção responsável, com termo próprio.

4. A ONG não venderá o animal. A escolha do novo lar é da ONG, que poderá, se quiser, dar notícias ao TUTOR.

5. Depois da entrega, o TUTOR não poderá reaver o animal, salvo se a ONG concordar por escrito.

6. O TUTOR se compromete a entregar, junto com o animal, a carteirinha de vacinação, receitas, exames e qualquer outro documento ou medicamento que tenha, e pode contribuir com ração e outros itens se quiser.

7. A ONG poderá usar fotos e a história do animal para divulgar sua adoção, sem divulgar os dados pessoais do TUTOR.

8. Os dados pessoais do TUTOR serão usados apenas para este processo, conforme a Lei Geral de Proteção de Dados.

{{city}}, {{date}}.

Este termo é assinado eletronicamente pelas duas partes, dentro do aplicativo Petfinder.`;
