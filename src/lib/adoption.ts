/**
 * Processo de adoção dentro do app: da ficha do adotante ao acompanhamento
 * depois da entrega, com o termo assinado eletronicamente. Uma adoção por
 * pet + adotante, ligada à conversa do chat. Fica em `adoptions.json`.
 * Plano completo em `docs/plano-processo-de-adocao.md`.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export type AdoptionStatus =
  | "ficha"
  | "analise"
  | "termo"
  | "entrega"
  | "acompanhamento"
  | "concluida"
  | "recusada"
  | "cancelada"
  /** O adotante devolveu o pet à ONG depois da adoção (ver `lib/surrender.ts`). */
  | "devolvida";

export const ADOPTION_STATUS_LABEL: Record<AdoptionStatus, string> = {
  ficha: "Preenchendo a ficha",
  analise: "Em análise pela ONG",
  termo: "Assinatura do termo",
  entrega: "Combinando a entrega",
  acompanhamento: "Acompanhamento",
  concluida: "Adoção concluída",
  recusada: "Não aprovada",
  cancelada: "Cancelada",
  devolvida: "Pet devolvido à ONG",
};

/** Etapas do caminho feliz, na ordem, para a linha do tempo. */
export const ADOPTION_STEPS: { status: AdoptionStatus; label: string }[] = [
  { status: "ficha", label: "Ficha" },
  { status: "analise", label: "Análise" },
  { status: "termo", label: "Termo" },
  { status: "entrega", label: "Entrega" },
  { status: "acompanhamento", label: "Acompanhamento" },
  { status: "concluida", label: "Concluída" },
];

export function isAdoptionActive(status: AdoptionStatus): boolean {
  return (
    status !== "concluida" &&
    status !== "recusada" &&
    status !== "cancelada" &&
    status !== "devolvida"
  );
}

export type AdoptionForm = {
  /** Por que quer adotar este pet. */
  reason: string;
  /** Quem mora na casa (adultos, crianças, idosos). */
  household: string;
  /** Outros animais e como se dão com novos pets. */
  otherPets: string;
  /** Onde o pet vai ficar e quem cuida no dia a dia. */
  routine: string;
  /** Experiência com animais (opcional). */
  experience?: string;
  /** Quantas horas por dia o pet fica sozinho (opcional). */
  hoursAlone?: string;
  agreesNeutering: boolean;
  agreesFollowUp: boolean;
  agreesVisit: boolean;
  /** ISO datetime do envio. */
  submittedAt: string;
};

export type AdoptionVisit = {
  required: boolean;
  /** Texto livre: "sábado, 10h" — a combinação principal acontece no chat. */
  scheduledFor: string;
  notes: string;
  done: boolean;
};

export type SignerRole = "ong" | "adopter";

export type Signature = {
  role: SignerRole;
  userId: string;
  name: string;
  /** Só dígitos. */
  cpf: string;
  /** ISO datetime. */
  signedAt: string;
  ip: string;
  userAgent: string;
  /** SHA-256 de (hash do texto + quem + quando). */
  hash: string;
};

export type AdoptionTerm = {
  /** Texto final, já com os dados preenchidos. Nunca muda depois de gerado. */
  text: string;
  /** SHA-256 do texto. */
  textHash: string;
  generatedAt: string;
  signatures: Signature[];
  /** Código de confirmação pendente por quem vai assinar. */
  pendingCodes: Partial<
    Record<SignerRole, { code: string; expiresAt: string }>
  >;
  /** Selo final, só depois das duas assinaturas. */
  finalHash: string | null;
};

/** Encontro combinado para a entrega do pet e as confirmações das duas partes. */
export type Handover = {
  place: string;
  /** ISO datetime do encontro. */
  at: string;
  scheduledBy: SignerRole;
  /** A entrega exige o código (OTP) que o adotante informa à ONG. */
  otpEnabled: boolean;
  /** Só no servidor: `toClientAdoption` zera. O adotante o vê por `reveal_otp`. */
  otp: string | null;
  /** A ONG confirmou que entregou. */
  ongDeliveredAt: string | null;
  /** O adotante confirmou que recebeu. */
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
  /** ISO datetime em que o relato é esperado. */
  dueAt: string;
  note: string;
  /** Foto que o adotante mandou junto do relato. */
  photoUrl?: string | null;
  receivedAt: string | null;
};

export type AdoptionEvent = {
  id: string;
  at: string;
  by: "adopter" | "ong" | "sistema";
  text: string;
};

export type Adoption = {
  id: string;
  petId: string;
  petName: string;
  ongId: string;
  adopterId: string;
  adopterName: string;
  conversationId: string | null;
  status: AdoptionStatus;
  form: AdoptionForm | null;
  visit: AdoptionVisit;
  /** Encontro de entrega — ausente em adoções antigas. */
  handover?: Handover | null;
  /** Motivo da recusa/cancelamento ou pedido de ajustes. */
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

/** Mensagem do primeiro campo que falta na ficha, ou null se tudo certo. */
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

/** Quem precisa agir agora (para destacar na lista da ONG e do adotante). */
export function whoActsNow(adoption: Adoption): SignerRole | null {
  switch (adoption.status) {
    case "ficha":
      return "adopter";
    case "analise":
      return "ong";
    case "entrega":
      return adoption.handover?.ongDeliveredAt &&
        !adoption.handover.adopterReceivedAt
        ? "adopter"
        : "ong";
    case "termo": {
      const signed = adoption.term?.signatures.map((s) => s.role) ?? [];
      if (!signed.includes("ong")) return "ong";
      if (!signed.includes("adopter")) return "adopter";
      return null;
    }
    case "acompanhamento": {
      const dueNow = adoption.followUps.some(
        (f) => f.receivedAt === null && f.dueAt <= new Date().toISOString(),
      );
      return dueNow ? "adopter" : null;
    }
    default:
      return null;
  }
}

/** Rótulo curto da etapa, mais fino que o status quando a entrega já começou. */
export function adoptionStageLabel(adoption: Adoption): string {
  if (adoption.status === "entrega") {
    const h = adoption.handover;
    if (!h) return "Combinando a entrega";
    if (h.ongDeliveredAt && !h.adopterReceivedAt)
      return "Aguardando o adotante confirmar";
    if (h.adopterReceivedAt && !h.ongDeliveredAt)
      return "Aguardando a ONG confirmar";
    return "Encontro marcado";
  }
  return ADOPTION_STATUS_LABEL[adoption.status];
}

/** Texto do botão que leva o adotante à próxima ação (ex.: no cabeçalho do chat). */
export function adopterNextActionLabel(adoption: Adoption): string | null {
  if (whoActsNow(adoption) !== "adopter") return null;
  switch (adoption.status) {
    case "ficha":
      return "Preencher a ficha";
    case "termo":
      return "Ler e assinar o termo";
    case "entrega":
      return adoption.handover?.ongDeliveredAt
        ? "Confirmar que recebeu o pet"
        : "Ver encontro e código";
    case "acompanhamento":
      return "Mandar notícias do pet";
    default:
      return null;
  }
}

/** Frase de topo da tela da adoção: de quem é a vez e o que fazer. */
export function turnHeadline(
  adoption: Adoption,
  role: SignerRole,
): { mine: boolean; text: string } | null {
  const other = role === "ong" ? adoption.adopterName : "a ONG";
  switch (adoption.status) {
    case "ficha":
      return role === "adopter"
        ? { mine: true, text: "É a sua vez: preencha a ficha de adoção." }
        : { mine: false, text: `Aguardando ${other} preencher a ficha.` };
    case "analise":
      return role === "ong"
        ? { mine: true, text: "É a sua vez: leia a ficha e decida." }
        : { mine: false, text: "A ONG está analisando a sua ficha." };
    case "termo": {
      const signed = adoption.term?.signatures.map((s) => s.role) ?? [];
      if (signed.includes(role))
        return { mine: false, text: `Você já assinou. Aguardando ${other}.` };
      return { mine: true, text: "É a sua vez: leia o termo e assine." };
    }
    case "entrega": {
      const h = adoption.handover;
      if (!h)
        return role === "ong"
          ? { mine: true, text: "É a sua vez: marque o encontro da entrega." }
          : { mine: false, text: "A ONG vai marcar o encontro da entrega." };
      if (h.ongDeliveredAt && !h.adopterReceivedAt)
        return role === "adopter"
          ? { mine: true, text: "É a sua vez: confirme que recebeu o pet." }
          : {
              mine: false,
              text: `Aguardando ${other} confirmar o recebimento.`,
            };
      return {
        mine: true,
        text:
          role === "ong"
            ? "No dia do encontro: peça o código ao adotante e confirme a entrega."
            : "No dia do encontro: mostre o código à ONG e depois confirme o recebimento.",
      };
    }
    case "acompanhamento":
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

/** Versão segura para o navegador: nunca expõe códigos de confirmação pendentes. */
export function toClientAdoption(adoption: Adoption): Adoption {
  return {
    ...adoption,
    term: adoption.term
      ? { ...adoption.term, pendingCodes: {} }
      : adoption.term,
    handover: adoption.handover ? { ...adoption.handover, otp: null } : null,
  };
}

/** Texto do lembrete do encontro quando ele é hoje ou amanhã; senão null. */
export function handoverReminder(
  handover: Handover | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!handover || handover.ongDeliveredAt) return null;
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
