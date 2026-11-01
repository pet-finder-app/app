import { createHash, randomInt } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AdoptionEvent, SignerRole } from "./adoption";
import { getAdoptionById, markAdoptionReturned } from "./adoptions";
import {
  appendSystemMessage,
  createSurrenderConversation,
} from "./conversations";
import { formatAddress } from "./ngo";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_LABEL,
} from "./pet";
import { createPet, getPetById, setPetArchived, setPetStatus } from "./pets";
import {
  isSurrenderActive,
  SURRENDER_REASON_LABEL,
  SURRENDER_TERM_TEMPLATE,
  validateSurrenderRequest,
  type Surrender,
  type SurrenderFormInput,
  type SurrenderPet,
} from "./surrender";
import { renderTermTemplate } from "./term-template";
import { findUserById, readUsers } from "./users";

/** Surrender persistence and workflow rules. All post-creation transitions pass through performAction for authorization, history, and chat notices. */

const FILE = path.join(process.cwd(), "src", "data", "surrenders.json");

async function readAll(): Promise<Surrender[]> {
  const raw = await fs.readFile(FILE, "utf-8");
  return (JSON.parse(raw) as { surrenders: Surrender[] }).surrenders;
}

async function writeAll(surrenders: Surrender[]): Promise<void> {
  await fs.writeFile(
    FILE,
    JSON.stringify({ surrenders }, null, 2) + "\n",
    "utf-8",
  );
}

const byRecent = (a: Surrender, b: Surrender) =>
  b.updatedAt.localeCompare(a.updatedAt);

export async function getSurrenderById(
  id: string,
): Promise<Surrender | undefined> {
  return (await readAll()).find((s) => s.id === id);
}

export async function listSurrendersByNgo(ngoId: string): Promise<Surrender[]> {
  return (await readAll()).filter((s) => s.ngoId === ngoId).sort(byRecent);
}

export async function listSurrendersByAdopter(
  adopterId: string,
): Promise<Surrender[]> {
  return (await readAll())
    .filter((s) => s.adopterId === adopterId)
    .sort(byRecent);
}

// ---------------------------------------------------------------------------

export type Actor = {
  id: string;
  role: SignerRole;
  ip: string;
  userAgent: string;
};

export type ActionResult =
  | { ok: true; surrender: Surrender; devCode?: string }
  | { ok: false; status: number; message: string };

const fail = (status: number, message: string): ActionResult => ({
  ok: false,
  status,
  message,
});

const sha256 = (text: string) =>
  createHash("sha256").update(text).digest("hex");

const CODE_TTL_MS = 10 * 60 * 1000;

function addEvent(
  surrender: Surrender,
  by: AdoptionEvent["by"],
  text: string,
): void {
  surrender.events.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    by,
    text,
  });
}

/** Record an event and announce it in the conversation. */
async function announce(
  surrender: Surrender,
  by: AdoptionEvent["by"],
  text: string,
): Promise<void> {
  addEvent(surrender, by, text);
  if (surrender.conversationId) {
    await appendSystemMessage(surrender.conversationId, text);
  }
}

export type CreateSurrenderInput = {
  ngoId: string;
  /** Present when a previously adopted pet is being returned. */
  adoptionId?: string | null;
  pet: SurrenderPet;
  form: SurrenderFormInput;
};

/** Create a guardian's surrender request directly in the review stage. */
export async function createSurrender(
  adopterId: string,
  input: CreateSurrenderInput,
): Promise<ActionResult> {
  const adopter = await findUserById(adopterId);
  const ngo = (await readUsers()).find(
    (u) => u.id === input.ngoId && u.role === "ngo",
  );
  if (!adopter?.adopter) return fail(401, "Faça login como adotante.");
  if (!ngo?.ngo || ngo.ngo.verification.status !== "verified") {
    return fail(404, "ONG não encontrada.");
  }

  const problem = validateSurrenderRequest(input.pet, input.form);
  if (problem) return fail(400, problem);

  // For returns, verify that the chosen NGO owns the pet and this person adopted it.
  let petId: string | null = null;
  const adoptionId = input.adoptionId ?? null;
  if (adoptionId) {
    const adoption = await getAdoptionById(adoptionId);
    if (
      !adoption ||
      adoption.adopterId !== adopterId ||
      adoption.ngoId !== ngo.id ||
      (adoption.status !== "follow_up" && adoption.status !== "completed")
    ) {
      return fail(409, "Esta adoção não está disponível para devolução.");
    }
    petId = adoption.petId;
  }

  const all = await readAll();
  const name = input.pet.name.trim().toLowerCase();
  const duplicate = all.find(
    (s) =>
      s.adopterId === adopterId &&
      s.ngoId === ngo.id &&
      isSurrenderActive(s.status) &&
      (petId ? s.petId === petId : s.pet.name.trim().toLowerCase() === name),
  );
  if (duplicate) {
    return fail(
      409,
      `Você já tem um pedido em andamento para deixar ${duplicate.pet.name} com esta ONG.`,
    );
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const surrender: Surrender = {
    id,
    ngoId: ngo.id,
    ngoName: ngo.ngo.legal.tradeName || ngo.name,
    adopterId,
    adopterName: adopter.adopter.personal.fullName || adopter.name,
    conversationId: null,
    status: "review",
    petId,
    adoptionId,
    pet: { ...input.pet, name: input.pet.name.trim() },
    form: { ...input.form, submittedAt: now },
    handover: null,
    decisionNote: "",
    term: null,
    receivedAt: null,
    receivedPetId: null,
    events: [],
    createdAt: now,
    updatedAt: now,
  };
  const conversation = await createSurrenderConversation({
    surrenderId: id,
    petName: surrender.pet.name,
    ngoId: ngo.id,
    adopterId,
    adopterName: surrender.adopterName,
  });
  surrender.conversationId = conversation.id;
  await announce(
    surrender,
    "adopter",
    `${surrender.adopterName} pediu para deixar ${surrender.pet.name} com a ONG. A ONG vai analisar o pedido.`,
  );
  await writeAll([...all, surrender]);
  return { ok: true, surrender };
}

export type SurrenderAction =
  | { action: "resubmit"; pet: SurrenderPet; form: SurrenderFormInput }
  | { action: "request_changes"; note: string }
  | { action: "reject"; note: string }
  | { action: "approve" }
  | { action: "set_handover"; place: string; at: string }
  | { action: "cancel"; note?: string }
  | { action: "send_code" }
  | { action: "sign"; code: string }
  | { action: "receive" };

async function generateTerm(surrender: Surrender): Promise<string | null> {
  const [ngoUser, adopterUser] = await Promise.all([
    findUserById(surrender.ngoId),
    findUserById(surrender.adopterId),
  ]);
  if (!ngoUser?.ngo || !adopterUser?.adopter) return null;

  const { legal, representative } = ngoUser.ngo;
  const { personal } = adopterUser.adopter;
  const { pet, form } = surrender;
  const health = [
    pet.health.vaccinated ? "vacinado" : null,
    pet.health.neutered ? "castrado" : null,
    pet.health.dewormed ? "vermifugado" : null,
    pet.health.specialNeeds.trim()
      ? `cuidados: ${pet.health.specialNeeds.trim()}`
      : null,
  ].filter(Boolean);

  return renderTermTemplate(SURRENDER_TERM_TEMPLATE, {
    "guardian.name": personal.fullName || adopterUser.name,
    "guardian.personalTaxId": personal.personalTaxId || "(CPF não informado)",
    "guardian.address":
      formatAddress(personal.address) || "(endereço não informado)",
    "pet.name": pet.name,
    "pet.species": PET_SPECIES_LABEL[pet.species],
    "pet.breed": pet.breed || "sem raça definida",
    "pet.sex": PET_SEX_LABEL[pet.sex],
    "pet.size": PET_SIZE_LABEL[pet.size],
    "pet.age": PET_AGE_GROUP_LABEL[pet.ageGroup],
    "pet.health": health.length > 0 ? health.join(", ") : "nada informado",
    reason: SURRENDER_REASON_LABEL[form.reason],
    "ngo.name": legal.tradeName || ngoUser.name,
    "ngo.document": legal.document || "(documento não informado)",
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

/** On intake, create an unavailable pet pending evaluation and care. Returning pets reuse the existing organization record. */
async function registerReceivedPet(surrender: Surrender): Promise<string> {
  if (surrender.petId) {
    const existing = await getPetById(surrender.petId);
    if (existing && existing.ngoId === surrender.ngoId) {
      await setPetStatus(existing.id, "unavailable");
      await setPetArchived(existing.id, surrender.ngoId, false);
      return existing.id;
    }
  }
  const { pet } = surrender;
  const created = await createPet(
    surrender.ngoId,
    {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      sex: pet.sex,
      size: pet.size,
      sizeCm: null,
      ageGroup: pet.ageGroup,
      temperament: [],
      health: pet.health,
      description: pet.description,
      photos: pet.photos,
    },
    "unavailable",
  );
  return created.id;
}

/** Single entry point for modifying an existing surrender request. */
export async function performAction(
  id: string,
  actor: Actor,
  input: SurrenderAction,
): Promise<ActionResult> {
  const all = await readAll();
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return fail(404, "Pedido não encontrado.");

  const surrender: Surrender = structuredClone(all[index]);
  const isNgo = actor.role === "ngo" && actor.id === surrender.ngoId;
  const isAdopter =
    actor.role === "adopter" && actor.id === surrender.adopterId;
  if (!isNgo && !isAdopter) return fail(404, "Pedido não encontrado.");

  const requireNgo = () =>
    isNgo ? null : fail(403, "Só a ONG pode fazer isso.");
  const requireAdopter = () =>
    isAdopter
      ? null
      : fail(403, "Só quem está entregando o pet pode fazer isso.");
  const requireStatus = (...statuses: Surrender["status"][]) =>
    statuses.includes(surrender.status)
      ? null
      : fail(409, "Esta ação não está disponível nesta etapa.");

  const now = new Date().toISOString();
  const petName = surrender.pet.name;
  let devCode: string | undefined;
  let error: ActionResult | null = null;

  switch (input.action) {
    case "resubmit": {
      error = requireAdopter() ?? requireStatus("application");
      if (error) return error;
      const problem = validateSurrenderRequest(input.pet, input.form);
      if (problem) return fail(400, problem);
      surrender.pet = { ...input.pet, name: input.pet.name.trim() };
      surrender.form = { ...input.form, submittedAt: now };
      surrender.status = "review";
      await announce(
        surrender,
        "adopter",
        `${surrender.adopterName} ajustou o pedido. A ONG vai analisar de novo.`,
      );
      break;
    }
    case "request_changes": {
      error = requireNgo() ?? requireStatus("review");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Explique o que precisa mudar.");
      surrender.decisionNote = input.note.trim();
      surrender.status = "application";
      await announce(
        surrender,
        "ngo",
        `A ONG pediu ajustes no pedido: ${surrender.decisionNote}`,
      );
      break;
    }
    case "reject": {
      error = requireNgo() ?? requireStatus("application", "review");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Conte o motivo com educação.");
      surrender.decisionNote = input.note.trim();
      surrender.status = "rejected";
      await announce(
        surrender,
        "ngo",
        `A ONG não conseguiu receber ${petName} agora. Motivo: ${surrender.decisionNote}`,
      );
      break;
    }
    case "approve": {
      error = requireNgo() ?? requireStatus("review");
      if (error) return error;
      const text = await generateTerm(surrender);
      if (!text) return fail(500, "Não foi possível montar o termo.");
      surrender.term = {
        text,
        textHash: sha256(text),
        generatedAt: now,
        signatures: [],
        pendingCodes: {},
        finalHash: null,
      };
      surrender.status = "agreement";
      await announce(
        surrender,
        "ngo",
        `A ONG aceitou receber ${petName}! O termo de entrega está pronto para assinar, por você e pela ONG.`,
      );
      break;
    }
    case "set_handover": {
      error = requireNgo() ?? requireStatus("agreement", "handover");
      if (error) return error;
      const place = input.place.trim();
      const at = new Date(input.at);
      if (!place) return fail(400, "Diga o local do encontro.");
      if (Number.isNaN(at.getTime()) || at.getTime() < Date.now() - 3_600_000) {
        return fail(
          400,
          "Escolha uma data e um horário que ainda não passaram.",
        );
      }
      surrender.handover = { place, at: at.toISOString() };
      await announce(
        surrender,
        "ngo",
        `A ONG marcou o encontro para receber ${petName}: ${at.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}, em ${place}.`,
      );
      break;
    }
    case "cancel": {
      error = requireStatus("application", "review", "agreement", "handover");
      if (error) return error;
      surrender.status = "cancelled";
      surrender.decisionNote = input.note?.trim() ?? "";
      await announce(
        surrender,
        isNgo ? "ngo" : "adopter",
        `${isNgo ? "A ONG" : surrender.adopterName} cancelou o pedido de entrega.`,
      );
      break;
    }
    case "send_code": {
      error = requireStatus("agreement");
      if (error) return error;
      if (surrender.term?.signatures.some((s) => s.role === actor.role)) {
        return fail(409, "Você já assinou este termo.");
      }
      // Prototype: without email/SMS, return the signing code so
      // the UI can display it as a test message. Production must deliver it separately.
      devCode = String(randomInt(100000, 1000000));
      surrender.term!.pendingCodes[actor.role] = {
        code: devCode,
        expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      };
      break;
    }
    case "sign": {
      error = requireStatus("agreement");
      if (error) return error;
      const term = surrender.term!;
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
        surrender.status = "handover";
        await announce(
          surrender,
          "system",
          `Termo assinado pelas duas partes! Combinem aqui o dia e o lugar para levar ${petName} até a ONG.`,
        );
      } else {
        await announce(
          surrender,
          isNgo ? "ngo" : "adopter",
          `${isNgo ? "A ONG" : surrender.adopterName} assinou o termo. Falta a assinatura de ${isNgo ? surrender.adopterName : "a ONG"}.`,
        );
      }
      break;
    }
    case "receive": {
      error = requireNgo() ?? requireStatus("handover");
      if (error) return error;
      surrender.receivedAt = now;
      surrender.status = "completed";
      surrender.receivedPetId = await registerReceivedPet(surrender);
      if (surrender.adoptionId) {
        await markAdoptionReturned(surrender.adoptionId, surrender.ngoId);
      }
      await announce(
        surrender,
        "ngo",
        `${surrender.ngoName} recebeu ${petName}. Obrigado por cuidar dele até aqui e por confiar na ONG!`,
      );
      break;
    }
  }

  surrender.updatedAt = now;
  all[index] = surrender;
  await writeAll(all);
  return { ok: true, surrender, devCode };
}
