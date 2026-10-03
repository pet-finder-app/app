import { createHash, randomInt } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AdoptionEvent, SignerRole } from "./adoption";
import { getAdoptionById, markAdoptionReturned } from "./adoptions";
import {
  appendSystemMessage,
  createSurrenderConversation,
} from "./conversations";
import { formatAddress } from "./ong";
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

/**
 * Regras da entrega de pet à ONG — hoje um arquivo JSON, amanhã o backend. É o
 * espelho de `lib/adoptions.ts`: toda mudança depois de criado passa por
 * `performAction`, que confere quem pode o quê e registra o histórico (e um
 * aviso no chat).
 */

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

export async function listSurrendersByOng(ongId: string): Promise<Surrender[]> {
  return (await readAll()).filter((s) => s.ongId === ongId).sort(byRecent);
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

/** Registra o evento e avisa no chat (a conversa continua sendo o centro). */
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
  ongId: string;
  /** Preenchido quando o pet foi adotado pelo app e está sendo devolvido. */
  adoptionId?: string | null;
  pet: SurrenderPet;
  form: SurrenderFormInput;
};

/** O adotante pede para deixar um pet com a ONG. O pedido já nasce "em análise". */
export async function createSurrender(
  adopterId: string,
  input: CreateSurrenderInput,
): Promise<ActionResult> {
  const adopter = await findUserById(adopterId);
  const ong = (await readUsers()).find(
    (u) => u.id === input.ongId && u.role === "ong",
  );
  if (!adopter?.adopter) return fail(401, "Faça login como adotante.");
  if (!ong?.ong || ong.ong.verification.status !== "verificada") {
    return fail(404, "ONG não encontrada.");
  }

  const problem = validateSurrenderRequest(input.pet, input.form);
  if (problem) return fail(400, problem);

  // Devolução: o pet precisa ser da ONG escolhida e ter sido adotado por esta pessoa.
  let petId: string | null = null;
  const adoptionId = input.adoptionId ?? null;
  if (adoptionId) {
    const adoption = await getAdoptionById(adoptionId);
    if (
      !adoption ||
      adoption.adopterId !== adopterId ||
      adoption.ongId !== ong.id ||
      (adoption.status !== "acompanhamento" && adoption.status !== "concluida")
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
      s.ongId === ong.id &&
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
    ongId: ong.id,
    ongName: ong.ong.legal.tradeName || ong.name,
    adopterId,
    adopterName: adopter.adopter.personal.fullName || adopter.name,
    conversationId: null,
    status: "analise",
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
    ongId: ong.id,
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
  const [ongUser, adopterUser] = await Promise.all([
    findUserById(surrender.ongId),
    findUserById(surrender.adopterId),
  ]);
  if (!ongUser?.ong || !adopterUser?.adopter) return null;

  const { legal, representative } = ongUser.ong;
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
    "tutor.nome": personal.fullName || adopterUser.name,
    "tutor.cpf": personal.cpf || "(CPF não informado)",
    "tutor.endereco":
      formatAddress(personal.address) || "(endereço não informado)",
    "pet.nome": pet.name,
    "pet.especie": PET_SPECIES_LABEL[pet.species],
    "pet.raca": pet.breed || "sem raça definida",
    "pet.sexo": PET_SEX_LABEL[pet.sex],
    "pet.porte": PET_SIZE_LABEL[pet.size],
    "pet.idade": PET_AGE_GROUP_LABEL[pet.ageGroup],
    "pet.saude": health.length > 0 ? health.join(", ") : "nada informado",
    motivo: SURRENDER_REASON_LABEL[form.reason],
    "ong.nome": legal.tradeName || ongUser.name,
    "ong.documento": legal.document || "(documento não informado)",
    "ong.responsavel": representative.fullName || "(responsável não informado)",
    cidade: legal.address.city || "(cidade)",
    data: new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });
}

/**
 * A ONG recebeu o animal: ele entra no catálogo dela como "indisponível" (para
 * ser avaliado, tratado e só então publicado). Se já era um pet da ONG
 * (devolução), reabre o mesmo cadastro.
 */
async function registerReceivedPet(surrender: Surrender): Promise<string> {
  if (surrender.petId) {
    const existing = await getPetById(surrender.petId);
    if (existing && existing.ongId === surrender.ongId) {
      await setPetStatus(existing.id, "indisponivel");
      await setPetArchived(existing.id, surrender.ongId, false);
      return existing.id;
    }
  }
  const { pet } = surrender;
  const created = await createPet(
    surrender.ongId,
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
    "indisponivel",
  );
  return created.id;
}

/** Única porta de entrada para mudar um pedido depois de criado. */
export async function performAction(
  id: string,
  actor: Actor,
  input: SurrenderAction,
): Promise<ActionResult> {
  const all = await readAll();
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return fail(404, "Pedido não encontrado.");

  const surrender: Surrender = structuredClone(all[index]);
  const isOng = actor.role === "ong" && actor.id === surrender.ongId;
  const isAdopter =
    actor.role === "adopter" && actor.id === surrender.adopterId;
  if (!isOng && !isAdopter) return fail(404, "Pedido não encontrado.");

  const requireOng = () =>
    isOng ? null : fail(403, "Só a ONG pode fazer isso.");
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
      error = requireAdopter() ?? requireStatus("ficha");
      if (error) return error;
      const problem = validateSurrenderRequest(input.pet, input.form);
      if (problem) return fail(400, problem);
      surrender.pet = { ...input.pet, name: input.pet.name.trim() };
      surrender.form = { ...input.form, submittedAt: now };
      surrender.status = "analise";
      await announce(
        surrender,
        "adopter",
        `${surrender.adopterName} ajustou o pedido. A ONG vai analisar de novo.`,
      );
      break;
    }
    case "request_changes": {
      error = requireOng() ?? requireStatus("analise");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Explique o que precisa mudar.");
      surrender.decisionNote = input.note.trim();
      surrender.status = "ficha";
      await announce(
        surrender,
        "ong",
        `A ONG pediu ajustes no pedido: ${surrender.decisionNote}`,
      );
      break;
    }
    case "reject": {
      error = requireOng() ?? requireStatus("ficha", "analise");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Conte o motivo com educação.");
      surrender.decisionNote = input.note.trim();
      surrender.status = "recusada";
      await announce(
        surrender,
        "ong",
        `A ONG não conseguiu receber ${petName} agora. Motivo: ${surrender.decisionNote}`,
      );
      break;
    }
    case "approve": {
      error = requireOng() ?? requireStatus("analise");
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
      surrender.status = "termo";
      await announce(
        surrender,
        "ong",
        `A ONG aceitou receber ${petName}! O termo de entrega está pronto para assinar, por você e pela ONG.`,
      );
      break;
    }
    case "set_handover": {
      error = requireOng() ?? requireStatus("termo", "entrega");
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
        "ong",
        `A ONG marcou o encontro para receber ${petName}: ${at.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}, em ${place}.`,
      );
      break;
    }
    case "cancel": {
      error = requireStatus("ficha", "analise", "termo", "entrega");
      if (error) return error;
      surrender.status = "cancelada";
      surrender.decisionNote = input.note?.trim() ?? "";
      await announce(
        surrender,
        isOng ? "ong" : "adopter",
        `${isOng ? "A ONG" : surrender.adopterName} cancelou o pedido de entrega.`,
      );
      break;
    }
    case "send_code": {
      error = requireStatus("termo");
      if (error) return error;
      if (surrender.term?.signatures.some((s) => s.role === actor.role)) {
        return fail(409, "Você já assinou este termo.");
      }
      // Protótipo: sem e-mail/SMS, o código volta na resposta e a tela o
      // mostra como "e-mail de teste". Com backend, sai por e-mail/SMS.
      devCode = String(randomInt(100000, 1000000));
      surrender.term!.pendingCodes[actor.role] = {
        code: devCode,
        expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      };
      break;
    }
    case "sign": {
      error = requireStatus("termo");
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
      const cpf = isOng
        ? signer?.ong?.representative.cpf
        : signer?.adopter?.personal.cpf;
      const name = isOng
        ? signer?.ong?.representative.fullName
        : signer?.adopter?.personal.fullName || signer?.name;
      if (!cpf || !name) {
        return fail(
          409,
          isOng
            ? "Complete o CPF do responsável em Configurações antes de assinar."
            : "Complete seu nome e CPF no perfil antes de assinar.",
        );
      }

      term.signatures.push({
        role: actor.role,
        userId: actor.id,
        name,
        cpf,
        signedAt: now,
        ip: actor.ip,
        userAgent: actor.userAgent,
        hash: sha256(`${term.textHash}|${actor.id}|${cpf}|${now}`),
      });
      delete term.pendingCodes[actor.role];

      if (term.signatures.length === 2) {
        term.finalHash = sha256(
          term.textHash + term.signatures.map((s) => s.hash).join(""),
        );
        surrender.status = "entrega";
        await announce(
          surrender,
          "sistema",
          `Termo assinado pelas duas partes! Combinem aqui o dia e o lugar para levar ${petName} até a ONG.`,
        );
      } else {
        await announce(
          surrender,
          isOng ? "ong" : "adopter",
          `${isOng ? "A ONG" : surrender.adopterName} assinou o termo. Falta a assinatura de ${isOng ? surrender.adopterName : "a ONG"}.`,
        );
      }
      break;
    }
    case "receive": {
      error = requireOng() ?? requireStatus("entrega");
      if (error) return error;
      surrender.receivedAt = now;
      surrender.status = "concluida";
      surrender.receivedPetId = await registerReceivedPet(surrender);
      if (surrender.adoptionId) {
        await markAdoptionReturned(surrender.adoptionId, surrender.ongId);
      }
      await announce(
        surrender,
        "ong",
        `${surrender.ongName} recebeu ${petName}. Obrigado por cuidar dele até aqui e por confiar na ONG!`,
      );
      break;
    }
  }

  surrender.updatedAt = now;
  all[index] = surrender;
  await writeAll(all);
  return { ok: true, surrender, devCode };
}
