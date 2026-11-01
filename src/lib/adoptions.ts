import { createHash, randomInt } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  isAdoptionActive,
  validateAdoptionForm,
  type Adoption,
  type AdoptionEvent,
  type AdoptionForm,
  type FollowUpKind,
  type SignerRole,
} from "./adoption";
import {
  maskCompanyTaxId,
  maskPersonalTaxId,
  onlyDigits,
} from "./br-documents";
import { appendSystemMessage, getConversationById } from "./conversations";
import type { Address } from "./ngo";
import { PET_AGE_GROUP_LABEL, PET_SEX_LABEL, PET_SPECIES_LABEL } from "./pet";
import { getPetById, setPetStatus } from "./pets";
import { renderTermTemplate } from "./term-template";
import { getTermTemplate } from "./term-templates";
import { findUserById } from "./users";

/** Adoption persistence and workflow rules. All transitions pass through performAction for authorization, history recording, and chat notifications. */

const FILE = path.join(process.cwd(), "src", "data", "adoptions.json");

async function readAll(): Promise<Adoption[]> {
  const raw = await fs.readFile(FILE, "utf-8");
  return (JSON.parse(raw) as { adoptions: Adoption[] }).adoptions;
}

async function writeAll(adoptions: Adoption[]): Promise<void> {
  await fs.writeFile(
    FILE,
    JSON.stringify({ adoptions }, null, 2) + "\n",
    "utf-8",
  );
}

const byRecent = (a: Adoption, b: Adoption) =>
  b.updatedAt.localeCompare(a.updatedAt);

export async function getAdoptionById(
  id: string,
): Promise<Adoption | undefined> {
  return (await readAll()).find((a) => a.id === id);
}

export async function listAdoptionsByNgo(ngoId: string): Promise<Adoption[]> {
  return (await readAll()).filter((a) => a.ngoId === ngoId).sort(byRecent);
}

export async function listAdoptionsByAdopter(
  adopterId: string,
): Promise<Adoption[]> {
  return (await readAll())
    .filter((a) => a.adopterId === adopterId)
    .sort(byRecent);
}

/** The adopter's latest adoption record for this pet, when available. */
export async function findAdoptionByPetAndAdopter(
  petId: string,
  adopterId: string,
): Promise<Adoption | undefined> {
  return (await listAdoptionsByAdopter(adopterId)).find(
    (a) => a.petId === petId,
  );
}

// ---------------------------------------------------------------------------

export type Actor = {
  id: string;
  role: SignerRole;
  ip: string;
  userAgent: string;
};

export type ActionResult =
  | { ok: true; adoption: Adoption; devCode?: string }
  | { ok: false; status: number; message: string };

const fail = (status: number, message: string): ActionResult => ({
  ok: false,
  status,
  message,
});

const sha256 = (text: string) =>
  createHash("sha256").update(text).digest("hex");

const DAY_MS = 24 * 60 * 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;

function addEvent(
  adoption: Adoption,
  by: AdoptionEvent["by"],
  text: string,
): void {
  adoption.events.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    by,
    text,
  });
}

/** Record an event and announce it in the conversation. */
async function announce(
  adoption: Adoption,
  by: AdoptionEvent["by"],
  text: string,
): Promise<void> {
  addEvent(adoption, by, text);
  if (adoption.conversationId) {
    await appendSystemMessage(adoption.conversationId, text);
  }
}

/** The NGO starts the process from a conversation. */
export async function startAdoption(
  ngoId: string,
  conversationId: string,
): Promise<ActionResult> {
  const conversation = await getConversationById(conversationId);
  if (!conversation || conversation.ngoId !== ngoId) {
    return fail(404, "Conversa não encontrada.");
  }
  const pet = await getPetById(conversation.petId);
  if (!pet || pet.ngoId !== ngoId) return fail(404, "Pet não encontrado.");

  const all = await readAll();
  const active = all.find(
    (a) => a.petId === pet.id && isAdoptionActive(a.status),
  );
  if (active) {
    return fail(
      409,
      active.adopterId === conversation.adopterId
        ? "Já existe uma adoção em andamento com esta pessoa."
        : `${pet.name} já está em processo de adoção com outra pessoa.`,
    );
  }

  const now = new Date().toISOString();
  const adoption: Adoption = {
    id: crypto.randomUUID(),
    petId: pet.id,
    petName: pet.name,
    ngoId,
    adopterId: conversation.adopterId,
    adopterName: conversation.adopterName,
    conversationId: conversation.id,
    status: "application",
    form: null,
    visit: { required: false, scheduledFor: "", notes: "", done: false },
    decisionNote: "",
    term: null,
    deliveredAt: null,
    followUps: [],
    events: [],
    createdAt: now,
    updatedAt: now,
  };
  await announce(
    adoption,
    "ngo",
    `A ONG iniciou o processo de adoção de ${pet.name}. Preencha a ficha de adoção para continuar.`,
  );
  await setPetStatus(pet.id, "in_progress");
  await writeAll([...all, adoption]);
  return { ok: true, adoption };
}

/** End follow-up when an already-delivered pet is returned through the surrender workflow. */
export async function markAdoptionReturned(
  adoptionId: string,
  ngoId: string,
): Promise<void> {
  const all = await readAll();
  const index = all.findIndex((a) => a.id === adoptionId && a.ngoId === ngoId);
  if (index === -1) return;
  const adoption: Adoption = structuredClone(all[index]);
  if (adoption.status !== "follow_up" && adoption.status !== "completed") {
    return;
  }
  adoption.status = "returned";
  addEvent(adoption, "system", `${adoption.petName} voltou para a ONG.`);
  adoption.updatedAt = new Date().toISOString();
  all[index] = adoption;
  await writeAll(all);
}

export type AdoptionAction =
  | { action: "submit_form"; form: Omit<AdoptionForm, "submittedAt"> }
  | {
      action: "set_visit";
      required: boolean;
      scheduledFor: string;
      notes: string;
      done: boolean;
    }
  | { action: "request_changes"; note: string }
  | { action: "reject"; note: string }
  | { action: "approve" }
  | { action: "cancel"; note?: string }
  | { action: "send_code" }
  | { action: "sign"; code: string }
  | {
      action: "schedule_handover";
      place: string;
      at: string;
      /** Whether handover requires an OTP; defaults to true. */
      otpEnabled?: boolean;
    }
  | { action: "reveal_otp" }
  | { action: "deliver"; code?: string }
  | { action: "confirm_receipt" }
  | {
      action: "followup";
      followUpId: string;
      note: string;
      photoUrl?: string | null;
    }
  | { action: "close" };

/** Format a Brazilian company or personal tax identifier according to its length. */
function ngoDocument(value: string): string {
  const digits = onlyDigits(value);
  return digits.length === 14
    ? `CNPJ ${maskCompanyTaxId(digits)}`
    : `CPF ${maskPersonalTaxId(digits)}`;
}

/** Full postal address for agreement rendering, omitting empty parts. */
function fullAddress(address: Address): string {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  const place = [street, address.complement, address.neighborhood]
    .filter(Boolean)
    .join(" - ");
  const city = [address.city, address.state].filter(Boolean).join("/");
  const postalCode = address.postalCode ? `CEP ${address.postalCode}` : "";
  return [place, city, postalCode].filter(Boolean).join(", ");
}

async function generateTerm(adoption: Adoption): Promise<string | null> {
  const [pet, ngoUser, adopterUser] = await Promise.all([
    getPetById(adoption.petId),
    findUserById(adoption.ngoId),
    findUserById(adoption.adopterId),
  ]);
  if (!pet || !ngoUser?.ngo || !adopterUser?.adopter) return null;

  const { legal, representative } = ngoUser.ngo;
  const { personal } = adopterUser.adopter;
  const template = await getTermTemplate(adoption.ngoId);
  return renderTermTemplate(template.body, {
    "pet.name": pet.name,
    "pet.species": PET_SPECIES_LABEL[pet.species],
    "pet.breed": pet.breed || "sem raça definida",
    "pet.sex": PET_SEX_LABEL[pet.sex],
    "adopter.name": personal.fullName || adopterUser.name,
    "pet.age": PET_AGE_GROUP_LABEL[pet.ageGroup],
    "pet.health":
      [
        pet.health.vaccinated ? "vacinado" : null,
        pet.health.neutered ? "castrado" : null,
        pet.health.dewormed ? "vermifugado" : null,
      ]
        .filter(Boolean)
        .join(", ") || "sem registro de vacinas ou castração",
    "adopter.personalTaxId":
      maskPersonalTaxId(personal.personalTaxId) || "(CPF não informado)",
    "adopter.address":
      fullAddress(personal.address) || "(endereço não informado)",
    "ngo.name": legal.tradeName || ngoUser.name,
    "ngo.document": legal.document
      ? ngoDocument(legal.document)
      : "(documento não informado)",
    "ngo.representative":
      representative.fullName || "(responsável não informado)",
    city: legal.address.city || "(cidade)",
    date: new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });
}

/** Single entry point for changing an existing adoption. */
export async function performAction(
  id: string,
  actor: Actor,
  input: AdoptionAction,
): Promise<ActionResult> {
  const all = await readAll();
  const index = all.findIndex((a) => a.id === id);
  if (index === -1) return fail(404, "Adoção não encontrada.");

  const adoption: Adoption = structuredClone(all[index]);
  const isNgo = actor.role === "ngo" && actor.id === adoption.ngoId;
  const isAdopter = actor.role === "adopter" && actor.id === adoption.adopterId;
  if (!isNgo && !isAdopter) return fail(404, "Adoção não encontrada.");

  const requireNgo = () =>
    isNgo ? null : fail(403, "Só a ONG pode fazer isso.");
  const requireAdopter = () =>
    isAdopter ? null : fail(403, "Só quem quer adotar pode fazer isso.");
  const requireStatus = (...statuses: Adoption["status"][]) =>
    statuses.includes(adoption.status)
      ? null
      : fail(409, "Esta ação não está disponível nesta etapa.");

  const now = new Date().toISOString();

  /** Both handover confirmations start follow-up and mark the pet adopted. */
  const finalizeDelivery = async () => {
    adoption.deliveredAt = now;
    adoption.status = "follow_up";
    const plan: [FollowUpKind, number][] = [
      ["7d", 7],
      ["30d", 30],
      ["90d", 90],
    ];
    adoption.followUps = plan.map(([kind, days]) => ({
      id: crypto.randomUUID(),
      kind,
      dueAt: new Date(Date.now() + days * DAY_MS).toISOString(),
      note: "",
      receivedAt: null,
    }));
    await announce(
      adoption,
      "system",
      `${adoption.petName} foi entregue e recebido! Vamos pedir notícias dele daqui a 1 semana, 1 mês e 3 meses.`,
    );
    await setPetStatus(adoption.petId, "adopted");
  };

  let devCode: string | undefined;
  let error: ActionResult | null = null;

  switch (input.action) {
    case "submit_form": {
      error = requireAdopter() ?? requireStatus("application");
      if (error) return error;
      const problem = validateAdoptionForm(input.form);
      if (problem) return fail(400, problem);
      adoption.form = { ...input.form, submittedAt: now };
      adoption.status = "review";
      await announce(
        adoption,
        "adopter",
        `${adoption.adopterName} enviou a ficha de adoção. A ONG vai analisar.`,
      );
      break;
    }
    case "set_visit": {
      error = requireNgo() ?? requireStatus("review");
      if (error) return error;
      adoption.visit = {
        required: input.required,
        scheduledFor: input.scheduledFor.trim(),
        notes: input.notes.trim(),
        done: input.required ? input.done : false,
      };
      addEvent(
        adoption,
        "ngo",
        input.required
          ? input.done
            ? "Visita registrada como feita."
            : "A ONG pediu uma visita antes de aprovar."
          : "A visita não será necessária.",
      );
      if (input.required && !input.done && adoption.conversationId) {
        await appendSystemMessage(
          adoption.conversationId,
          input.scheduledFor.trim()
            ? `A ONG pediu uma visita: ${input.scheduledFor.trim()}.`
            : "A ONG pediu uma visita. Combinem o melhor dia por aqui.",
        );
      }
      break;
    }
    case "request_changes": {
      error = requireNgo() ?? requireStatus("review");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Explique o que precisa mudar.");
      adoption.decisionNote = input.note.trim();
      adoption.status = "application";
      await announce(
        adoption,
        "ngo",
        `A ONG pediu ajustes na ficha: ${adoption.decisionNote}`,
      );
      break;
    }
    case "reject": {
      error = requireNgo() ?? requireStatus("application", "review");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Conte o motivo com educação.");
      adoption.decisionNote = input.note.trim();
      adoption.status = "rejected";
      await announce(
        adoption,
        "ngo",
        `A ONG não seguiu com esta adoção. Motivo: ${adoption.decisionNote}`,
      );
      await setPetStatus(adoption.petId, "available");
      break;
    }
    case "approve": {
      error = requireNgo() ?? requireStatus("review");
      if (error) return error;
      if (adoption.visit.required && !adoption.visit.done) {
        return fail(409, "Registre que a visita foi feita antes de aprovar.");
      }
      const text = await generateTerm(adoption);
      if (!text) return fail(500, "Não foi possível montar o termo.");
      adoption.term = {
        text,
        textHash: sha256(text),
        generatedAt: now,
        signatures: [],
        pendingCodes: {},
        finalHash: null,
      };
      adoption.status = "agreement";
      await announce(
        adoption,
        "ngo",
        `Adoção aprovada! O termo de adoção de ${adoption.petName} está pronto para assinar, pela ONG e por você.`,
      );
      break;
    }
    case "cancel": {
      error = requireStatus("application", "review", "agreement", "handover");
      if (error) return error;
      adoption.status = "cancelled";
      adoption.decisionNote = input.note?.trim() ?? "";
      await announce(
        adoption,
        isNgo ? "ngo" : "adopter",
        `${isNgo ? "A ONG" : adoption.adopterName} cancelou o processo de adoção.`,
      );
      await setPetStatus(adoption.petId, "available");
      break;
    }
    case "send_code": {
      error = requireStatus("agreement");
      if (error) return error;
      if (adoption.term?.signatures.some((s) => s.role === actor.role)) {
        return fail(409, "Você já assinou este termo.");
      }
      // Prototype: without email/SMS, return the signing code so
      // the UI can display it as a test message. Production must deliver it separately.
      devCode = String(randomInt(100000, 1000000));
      adoption.term!.pendingCodes[actor.role] = {
        code: devCode,
        expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      };
      break;
    }
    case "sign": {
      error = requireStatus("agreement");
      if (error) return error;
      const term = adoption.term!;
      if (term.signatures.some((s) => s.role === actor.role)) {
        return fail(409, "Você já assinou este termo.");
      }
      const pending = term.pendingCodes[actor.role];
      if (!pending || pending.expiresAt < now) {
        return fail(400, "O código venceu. Peça um novo código.");
      }
      if (pending.code !== input.code.trim()) {
        return fail(400, "Código incorreto. Confira e tente de novo.");
      }

      const signer = await findUserById(actor.id);
      const personalTaxId = isNgo
        ? signer?.ngo?.representative.personalTaxId
        : signer?.adopter?.personal.personalTaxId;
      const name = isNgo
        ? signer?.ngo?.representative.fullName
        : signer?.adopter?.personal.fullName || signer?.name;
      if (!personalTaxId || !name) {
        return fail(
          409,
          isNgo
            ? "Complete o CPF do responsável em Configurações antes de assinar."
            : "Complete seu nome e CPF no perfil antes de assinar.",
        );
      }

      term.signatures.push({
        role: actor.role,
        userId: actor.id,
        name,
        personalTaxId,
        signedAt: now,
        ip: actor.ip,
        userAgent: actor.userAgent,
        hash: sha256(`${term.textHash}|${actor.id}|${personalTaxId}|${now}`),
      });
      delete term.pendingCodes[actor.role];

      if (term.signatures.length === 2) {
        term.finalHash = sha256(
          term.textHash + term.signatures.map((s) => s.hash).join(""),
        );
        adoption.status = "handover";
        await announce(
          adoption,
          "system",
          "Termo assinado pelas duas partes! Combinem aqui a entrega de " +
            `${adoption.petName}.`,
        );
      } else {
        await announce(
          adoption,
          isNgo ? "ngo" : "adopter",
          `${isNgo ? "A ONG" : adoption.adopterName} assinou o termo. Falta a assinatura de ${isNgo ? adoption.adopterName : "a ONG"}.`,
        );
      }
      break;
    }
    case "schedule_handover": {
      error = requireStatus("handover");
      if (error) return error;
      const place = input.place?.trim();
      const at = new Date(input.at);
      if (!place) return fail(400, "Informe o local do encontro.");
      if (Number.isNaN(at.getTime()))
        return fail(400, "Informe a data e o horário do encontro.");
      if (at.getTime() < Date.now() - 60_000)
        return fail(400, "Escolha uma data e horário que ainda não passaram.");
      if (
        adoption.handover?.ngoDeliveredAt ||
        adoption.handover?.adopterReceivedAt
      ) {
        return fail(409, "A entrega já foi confirmada por uma das partes.");
      }
      const otpEnabled = input.otpEnabled !== false;
      adoption.handover = {
        place,
        at: at.toISOString(),
        scheduledBy: actor.role,
        otpEnabled,
        otp: otpEnabled
          ? (adoption.handover?.otp ?? String(randomInt(100000, 1000000)))
          : null,
        ngoDeliveredAt: null,
        adopterReceivedAt: null,
      };
      await announce(
        adoption,
        isNgo ? "ngo" : "adopter",
        `Encontro marcado: ${at.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}, em ${place}. Vocês receberão um lembrete perto do horário.`,
      );
      break;
    }
    case "reveal_otp": {
      error = requireAdopter() ?? requireStatus("handover");
      if (error) return error;
      if (!adoption.handover?.otp)
        return fail(409, "Marque o encontro para gerar o código.");
      // Prototype: return the code in the response; production must send it by email/SMS.
      devCode = adoption.handover.otp;
      break;
    }
    case "deliver": {
      error = requireNgo() ?? requireStatus("handover");
      if (error) return error;
      const handover = adoption.handover;
      if (!handover)
        return fail(409, "Marque o encontro antes de confirmar a entrega.");
      if (handover.ngoDeliveredAt)
        return fail(409, "Você já confirmou a entrega.");
      if (handover.otpEnabled && handover.otp !== input.code?.trim()) {
        return fail(
          400,
          "Código incorreto. Peça ao adotante o código que aparece no app dele.",
        );
      }
      handover.ngoDeliveredAt = now;
      if (handover.adopterReceivedAt) {
        await finalizeDelivery();
      } else {
        await announce(
          adoption,
          "ngo",
          `A ONG confirmou a entrega de ${adoption.petName}. Falta ${adoption.adopterName} confirmar o recebimento.`,
        );
      }
      break;
    }
    case "confirm_receipt": {
      error = requireAdopter() ?? requireStatus("handover");
      if (error) return error;
      const handover = adoption.handover;
      if (!handover)
        return fail(409, "Marque o encontro antes de confirmar o recebimento.");
      if (handover.adopterReceivedAt)
        return fail(409, "Você já confirmou o recebimento.");
      handover.adopterReceivedAt = now;
      if (handover.ngoDeliveredAt) {
        await finalizeDelivery();
      } else {
        await announce(
          adoption,
          "adopter",
          `${adoption.adopterName} confirmou que recebeu ${adoption.petName}. Falta a ONG confirmar a entrega.`,
        );
      }
      break;
    }
    case "followup": {
      error = requireAdopter() ?? requireStatus("follow_up");
      if (error) return error;
      const followUp = adoption.followUps.find(
        (f) => f.id === input.followUpId,
      );
      if (!followUp) return fail(404, "Acompanhamento não encontrado.");
      if (!input.note.trim()) return fail(400, "Conte como o pet está.");
      followUp.note = input.note.trim();
      followUp.photoUrl = input.photoUrl ?? null;
      followUp.receivedAt = now;
      await announce(
        adoption,
        "adopter",
        `${adoption.adopterName} mandou notícias de ${adoption.petName}.`,
      );
      break;
    }
    case "close": {
      error = requireNgo() ?? requireStatus("follow_up");
      if (error) return error;
      adoption.status = "completed";
      await announce(
        adoption,
        "ngo",
        `Adoção de ${adoption.petName} concluída. Obrigado por dar um lar!`,
      );
      break;
    }
  }

  adoption.updatedAt = now;
  all[index] = adoption;
  await writeAll(all);
  return { ok: true, adoption, devCode };
}
