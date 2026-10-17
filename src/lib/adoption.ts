/** Client-safe adoption process model, from application through signed agreement and post-adoption follow-up. One record per pet/adopter, linked to a conversation and stored in adoptions.json. */

export type AdoptionStatus =
  | "application"
  | "review"
  | "agreement"
  | "handover"
  | "follow_up"
  | "completed"
  | "rejected"
  | "cancelled"
  /** The adopter returned the pet to the NGO through the surrender workflow. */
  | "returned";

export const ADOPTION_STATUS_LABEL: Record<AdoptionStatus, string> = {
  application: "Preenchendo a ficha",
  review: "Em análise pela ONG",
  agreement: "Assinatura do termo",
  handover: "Combinando a entrega",
  follow_up: "Acompanhamento",
  completed: "Adoção concluída",
  rejected: "Não aprovada",
  cancelled: "Cancelada",
  returned: "Pet devolvido à ONG",
};

/** Ordered successful-process stages for the timeline. */
export const ADOPTION_STEPS: { status: AdoptionStatus; label: string }[] = [
  { status: "application", label: "Ficha" },
  { status: "review", label: "Análise" },
  { status: "agreement", label: "Termo" },
  { status: "handover", label: "Entrega" },
  { status: "follow_up", label: "Acompanhamento" },
  { status: "completed", label: "Concluída" },
];

export function isAdoptionActive(status: AdoptionStatus): boolean {
  return (
    status !== "completed" &&
    status !== "rejected" &&
    status !== "cancelled" &&
    status !== "returned"
  );
}

export type AdoptionForm = {
  /** Reason for adopting this pet. */
  reason: string;
  /** Household composition, including adults, children, and older residents. */
  household: string;
  /** Other pets and their behavior around new animals. */
  otherPets: string;
  /** Pet accommodation and daily care arrangements. */
  routine: string;
  /** Optional animal-care experience. */
  experience?: string;
  /** Optional number of hours the pet spends alone daily. */
  hoursAlone?: string;
  agreesNeutering: boolean;
  agreesFollowUp: boolean;
  agreesVisit: boolean;
  /** ISO submission timestamp. */
  submittedAt: string;
};

export type AdoptionVisit = {
  required: boolean;
  /** Free-text visit schedule; final arrangements are discussed in chat. */
  scheduledFor: string;
  notes: string;
  done: boolean;
};

export type SignerRole = "ngo" | "adopter";

export type Signature = {
  role: SignerRole;
  userId: string;
  name: string;
  /** Digits only. */
  personalTaxId: string;
  /** ISO timestamp. */
  signedAt: string;
  ip: string;
  userAgent: string;
  /** SHA-256 of the agreement hash, signer identity, and signing timestamp. */
  hash: string;
};

export type AdoptionTerm = {
  /** Final populated agreement text; immutable after generation. */
  text: string;
  /** SHA-256 of the agreement text. */
  textHash: string;
  generatedAt: string;
  signatures: Signature[];
  /** Pending confirmation code indexed by signer role. */
  pendingCodes: Partial<
    Record<SignerRole, { code: string; expiresAt: string }>
  >;
  /** Final evidence hash, available only after both signatures. */
  finalHash: string | null;
};

/** Pet handover meeting and both parties' confirmations. */
export type Handover = {
  place: string;
  /** ISO meeting timestamp. */
  at: string;
  scheduledBy: SignerRole;
  /** Require the adopter to provide the handover OTP to the NGO. */
  otpEnabled: boolean;
  /** Server-only OTP. Client projections clear it; the adopter retrieves it through reveal_otp. */
  otp: string | null;
  /** The NGO confirmed delivery. */
  ngoDeliveredAt: string | null;
  /** The adopter confirmed receipt. */
  adopterReceivedAt: string | null;
};

export type FollowUpKind = "7d" | "30d" | "90d";

export const FOLLOW_UP_LABEL: Record<FollowUpKind, string> = {
  "7d": "1 semana",
  "30d": "1 mês",
  "90d": "3 meses",
};

export type FollowUp = {
  id: string;
  kind: FollowUpKind;
  /** ISO timestamp when the follow-up report becomes due. */
  dueAt: string;
  note: string;
  /** Optional photo attached to the adopter's report. */
  photoUrl?: string | null;
  receivedAt: string | null;
};

export type AdoptionEvent = {
  id: string;
  at: string;
  by: "adopter" | "ngo" | "system";
  text: string;
};

export type Adoption = {
  id: string;
  petId: string;
  petName: string;
  ngoId: string;
  adopterId: string;
  adopterName: string;
  conversationId: string | null;
  status: AdoptionStatus;
  form: AdoptionForm | null;
  visit: AdoptionVisit;
  /** Handover meeting; absent from legacy adoption records. */
  handover?: Handover | null;
  /** Explanation for rejection, cancellation, or requested changes. */
  decisionNote: string;
  term: AdoptionTerm | null;
  deliveredAt: string | null;
  followUps: FollowUp[];
  events: AdoptionEvent[];
  createdAt: string;
  updatedAt: string;
};

export function createEmptyAdoptionForm(): Omit<AdoptionForm, "submittedAt"> {
  return {
    reason: "",
    household: "",
    otherPets: "",
    routine: "",
    experience: "",
    hoursAlone: "",
    agreesNeutering: false,
    agreesFollowUp: false,
    agreesVisit: false,
  };
}

/** First missing application-field error, or null when valid. */
export function validateAdoptionForm(
  form: Omit<AdoptionForm, "submittedAt">,
): string | null {
  if (!form.reason.trim()) return "Conte por que você quer adotar este pet.";
  if (!form.household.trim()) return "Conte quem mora na sua casa.";
  if (!form.routine.trim())
    return "Conte onde o pet vai ficar e quem cuida dele.";
  if (!form.agreesFollowUp)
    return "Para seguir, é preciso aceitar o acompanhamento depois da adoção.";
  return null;
}

/** Participant who must act next, for list highlighting. */
export function whoActsNow(adoption: Adoption): SignerRole | null {
  switch (adoption.status) {
    case "application":
      return "adopter";
    case "review":
      return "ngo";
    case "handover":
      return adoption.handover?.ngoDeliveredAt &&
        !adoption.handover.adopterReceivedAt
        ? "adopter"
        : "ngo";
    case "agreement": {
      const signed = adoption.term?.signatures.map((s) => s.role) ?? [];
      if (!signed.includes("ngo")) return "ngo";
      if (!signed.includes("adopter")) return "adopter";
      return null;
    }
    case "follow_up": {
      const dueNow = adoption.followUps.some(
        (f) => f.receivedAt === null && f.dueAt <= new Date().toISOString(),
      );
      return dueNow ? "adopter" : null;
    }
    default:
      return null;
  }
}

/** Short stage label with more detail during handover. */
export function adoptionStageLabel(adoption: Adoption): string {
  if (adoption.status === "handover") {
    const h = adoption.handover;
    if (!h) return "Combinando a entrega";
    if (h.ngoDeliveredAt && !h.adopterReceivedAt)
      return "Aguardando o adotante confirmar";
    if (h.adopterReceivedAt && !h.ngoDeliveredAt)
      return "Aguardando a ONG confirmar";
    return "Encontro marcado";
  }
  return ADOPTION_STATUS_LABEL[adoption.status];
}

/** Button text leading the adopter to their next action. */
export function adopterNextActionLabel(adoption: Adoption): string | null {
  if (whoActsNow(adoption) !== "adopter") return null;
  switch (adoption.status) {
    case "application":
      return "Preencher a ficha";
    case "agreement":
      return "Ler e assinar o termo";
    case "handover":
      return adoption.handover?.ngoDeliveredAt
        ? "Confirmar que recebeu o pet"
        : "Ver encontro e código";
    case "follow_up":
      return "Mandar notícias do pet";
    default:
      return null;
  }
}

/** Adoption-page headline explaining whose turn it is and what to do. */
export function turnHeadline(
  adoption: Adoption,
  role: SignerRole,
): { mine: boolean; text: string } | null {
  const other = role === "ngo" ? adoption.adopterName : "a ONG";
  switch (adoption.status) {
    case "application":
      return role === "adopter"
        ? { mine: true, text: "É a sua vez: preencha a ficha de adoção." }
        : { mine: false, text: `Aguardando ${other} preencher a ficha.` };
    case "review":
      return role === "ngo"
        ? { mine: true, text: "É a sua vez: leia a ficha e decida." }
        : { mine: false, text: "A ONG está analisando a sua ficha." };
    case "agreement": {
      const signed = adoption.term?.signatures.map((s) => s.role) ?? [];
      if (signed.includes(role))
        return { mine: false, text: `Você já assinou. Aguardando ${other}.` };
      return { mine: true, text: "É a sua vez: leia o termo e assine." };
    }
    case "handover": {
      const h = adoption.handover;
      if (!h)
        return role === "ngo"
          ? { mine: true, text: "É a sua vez: marque o encontro da entrega." }
          : { mine: false, text: "A ONG vai marcar o encontro da entrega." };
      if (h.ngoDeliveredAt && !h.adopterReceivedAt)
        return role === "adopter"
          ? { mine: true, text: "É a sua vez: confirme que recebeu o pet." }
          : {
              mine: false,
              text: `Aguardando ${other} confirmar o recebimento.`,
            };
      return {
        mine: true,
        text:
          role === "ngo"
            ? "No dia do encontro: peça o código ao adotante e confirme a entrega."
            : "No dia do encontro: mostre o código à ONG e depois confirme o recebimento.",
      };
    }
    case "follow_up":
      return role === "adopter"
        ? {
            mine: whoActsNow(adoption) === "adopter",
            text: "Conte à ONG como o pet está se adaptando.",
          }
        : { mine: false, text: "Acompanhe as notícias do pet." };
    default:
      return null;
  }
}

/** Browser-safe projection that never exposes pending signing codes. */
export function toClientAdoption(adoption: Adoption): Adoption {
  return {
    ...adoption,
    term: adoption.term
      ? { ...adoption.term, pendingCodes: {} }
      : adoption.term,
    handover: adoption.handover ? { ...adoption.handover, otp: null } : null,
  };
}

/** Meeting reminder when scheduled for today or tomorrow; otherwise null. */
export function handoverReminder(
  handover: Handover | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!handover || handover.ngoDeliveredAt) return null;
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
