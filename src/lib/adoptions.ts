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
import { maskCnpj, maskCpf, onlyDigits } from "./br-documents";
import { appendSystemMessage, getConversationById } from "./conversations";
import type { Address } from "./ong";
import { PET_AGE_GROUP_LABEL, PET_SEX_LABEL, PET_SPECIES_LABEL } from "./pet";
import { getPetById, setPetStatus } from "./pets";
import { renderTermTemplate } from "./term-template";
import { getTermTemplate } from "./term-templates";
import { findUserById } from "./users";

/**
 * Regras do processo de adoção — hoje um arquivo JSON, amanhã o backend. Todas
 * as mudanças de estado passam por `performAction`, que confere quem pode
 * fazer o quê e registra o histórico (e um aviso no chat).
 */

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

export async function listAdoptionsByOng(ongId: string): Promise<Adoption[]> {
  return (await readAll()).filter((a) => a.ongId === ongId).sort(byRecent);
}

export async function listAdoptionsByAdopter(
  adopterId: string,
): Promise<Adoption[]> {
  return (await readAll())
    .filter((a) => a.adopterId === adopterId)
    .sort(byRecent);
}

/** A adoção mais recente deste adotante para este pet, se houver. */
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

/** Registra o evento e avisa no chat (a conversa continua sendo o centro). */
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

/** A ONG inicia o processo a partir de uma conversa. */
export async function startAdoption(
  ongId: string,
  conversationId: string,
): Promise<ActionResult> {
  const conversation = await getConversationById(conversationId);
  if (!conversation || conversation.ongId !== ongId) {
    return fail(404, "Conversa não encontrada.");
  }
  const pet = await getPetById(conversation.petId);
  if (!pet || pet.ongId !== ongId) return fail(404, "Pet não encontrado.");

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
    ongId,
    adopterId: conversation.adopterId,
    adopterName: conversation.adopterName,
    conversationId: conversation.id,
    status: "ficha",
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
    "ong",
    `A ONG iniciou o processo de adoção de ${pet.name}. Preencha a ficha de adoção para continuar.`,
  );
  await setPetStatus(pet.id, "em_processo");
  await writeAll([...all, adoption]);
  return { ok: true, adoption };
}

/**
 * O adotante devolveu o pet à ONG (pelo fluxo de entrega, `lib/surrenders.ts`):
 * encerra o acompanhamento. Só vale para adoções já entregues.
 */
export async function markAdoptionReturned(
  adoptionId: string,
  ongId: string,
): Promise<void> {
  const all = await readAll();
  const index = all.findIndex((a) => a.id === adoptionId && a.ongId === ongId);
  if (index === -1) return;
  const adoption: Adoption = structuredClone(all[index]);
  if (adoption.status !== "acompanhamento" && adoption.status !== "concluida") {
    return;
  }
  adoption.status = "devolvida";
  addEvent(adoption, "sistema", `${adoption.petName} voltou para a ONG.`);
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
      /** Exigir o código (OTP) na entrega. Padrão: sim. */
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

/** "CNPJ 00.000.000/0000-00" ou "CPF 000.000.000-00", conforme o tamanho. */
function ongDocument(value: string): string {
  const digits = onlyDigits(value);
  return digits.length === 14
    ? `CNPJ ${maskCnpj(digits)}`
    : `CPF ${maskCpf(digits)}`;
}

/** Endereço completo para o termo: rua, número, complemento, bairro, cidade/UF e CEP. */
function fullAddress(address: Address): string {
  const street = [address.street, address.number].filter(Boolean).join(", ");
  const place = [street, address.complement, address.neighborhood]
    .filter(Boolean)
    .join(" - ");
  const city = [address.city, address.state].filter(Boolean).join("/");
  const cep = address.cep ? `CEP ${address.cep}` : "";
  return [place, city, cep].filter(Boolean).join(", ");
}

async function generateTerm(adoption: Adoption): Promise<string | null> {
  const [pet, ongUser, adopterUser] = await Promise.all([
    getPetById(adoption.petId),
    findUserById(adoption.ongId),
    findUserById(adoption.adopterId),
  ]);
  if (!pet || !ongUser?.ong || !adopterUser?.adopter) return null;

  const { legal, representative } = ongUser.ong;
  const { personal } = adopterUser.adopter;
  const template = await getTermTemplate(adoption.ongId);
  return renderTermTemplate(template.body, {
    "pet.nome": pet.name,
    "pet.especie": PET_SPECIES_LABEL[pet.species],
    "pet.raca": pet.breed || "sem raça definida",
    "pet.sexo": PET_SEX_LABEL[pet.sex],
    "adotante.nome": personal.fullName || adopterUser.name,
    "pet.idade": PET_AGE_GROUP_LABEL[pet.ageGroup],
    "pet.saude":
      [
        pet.health.vaccinated ? "vacinado" : null,
        pet.health.neutered ? "castrado" : null,
        pet.health.dewormed ? "vermifugado" : null,
      ]
        .filter(Boolean)
        .join(", ") || "sem registro de vacinas ou castração",
    "adotante.cpf": maskCpf(personal.cpf) || "(CPF não informado)",
    "adotante.endereco":
      fullAddress(personal.address) || "(endereço não informado)",
    "ong.nome": legal.tradeName || ongUser.name,
    "ong.documento": legal.document
      ? ongDocument(legal.document)
      : "(documento não informado)",
    "ong.responsavel": representative.fullName || "(responsável não informado)",
    cidade: legal.address.city || "(cidade)",
    data: new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  });
}

/** Única porta de entrada para mudar uma adoção depois de criada. */
export async function performAction(
  id: string,
  actor: Actor,
  input: AdoptionAction,
): Promise<ActionResult> {
  const all = await readAll();
  const index = all.findIndex((a) => a.id === id);
  if (index === -1) return fail(404, "Adoção não encontrada.");

  const adoption: Adoption = structuredClone(all[index]);
  const isOng = actor.role === "ong" && actor.id === adoption.ongId;
  const isAdopter = actor.role === "adopter" && actor.id === adoption.adopterId;
  if (!isOng && !isAdopter) return fail(404, "Adoção não encontrada.");

  const requireOng = () =>
    isOng ? null : fail(403, "Só a ONG pode fazer isso.");
  const requireAdopter = () =>
    isAdopter ? null : fail(403, "Só quem quer adotar pode fazer isso.");
  const requireStatus = (...statuses: Adoption["status"][]) =>
    statuses.includes(adoption.status)
      ? null
      : fail(409, "Esta ação não está disponível nesta etapa.");

  const now = new Date().toISOString();

  /** Entrega e recebimento confirmados: começa o acompanhamento e o pet vira "Adotado". */
  const finalizeDelivery = async () => {
    adoption.deliveredAt = now;
    adoption.status = "acompanhamento";
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
      "sistema",
      `${adoption.petName} foi entregue e recebido! Vamos pedir notícias dele daqui a 1 semana, 1 mês e 3 meses.`,
    );
    await setPetStatus(adoption.petId, "adotado");
  };

  let devCode: string | undefined;
  let error: ActionResult | null = null;

  switch (input.action) {
    case "submit_form": {
      error = requireAdopter() ?? requireStatus("ficha");
      if (error) return error;
      const problem = validateAdoptionForm(input.form);
      if (problem) return fail(400, problem);
      adoption.form = { ...input.form, submittedAt: now };
      adoption.status = "analise";
      await announce(
        adoption,
        "adopter",
        `${adoption.adopterName} enviou a ficha de adoção. A ONG vai analisar.`,
      );
      break;
    }
    case "set_visit": {
      error = requireOng() ?? requireStatus("analise");
      if (error) return error;
      adoption.visit = {
        required: input.required,
        scheduledFor: input.scheduledFor.trim(),
        notes: input.notes.trim(),
        done: input.required ? input.done : false,
      };
      addEvent(
        adoption,
        "ong",
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
      error = requireOng() ?? requireStatus("analise");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Explique o que precisa mudar.");
      adoption.decisionNote = input.note.trim();
      adoption.status = "ficha";
      await announce(
        adoption,
        "ong",
        `A ONG pediu ajustes na ficha: ${adoption.decisionNote}`,
      );
      break;
    }
    case "reject": {
      error = requireOng() ?? requireStatus("ficha", "analise");
      if (error) return error;
      if (!input.note.trim()) return fail(400, "Conte o motivo com educação.");
      adoption.decisionNote = input.note.trim();
      adoption.status = "recusada";
      await announce(
        adoption,
        "ong",
        `A ONG não seguiu com esta adoção. Motivo: ${adoption.decisionNote}`,
      );
      await setPetStatus(adoption.petId, "disponivel");
      break;
    }
    case "approve": {
      error = requireOng() ?? requireStatus("analise");
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
      adoption.status = "termo";
      await announce(
        adoption,
        "ong",
        `Adoção aprovada! O termo de adoção de ${adoption.petName} está pronto para assinar, pela ONG e por você.`,
      );
      break;
    }
    case "cancel": {
      error = requireStatus("ficha", "analise", "termo", "entrega");
      if (error) return error;
      adoption.status = "cancelada";
      adoption.decisionNote = input.note?.trim() ?? "";
      await announce(
        adoption,
        isOng ? "ong" : "adopter",
        `${isOng ? "A ONG" : adoption.adopterName} cancelou o processo de adoção.`,
      );
      await setPetStatus(adoption.petId, "disponivel");
      break;
    }
    case "send_code": {
      error = requireStatus("termo");
      if (error) return error;
      if (adoption.term?.signatures.some((s) => s.role === actor.role)) {
        return fail(409, "Você já assinou este termo.");
      }
      // Protótipo: sem e-mail/SMS, o código volta na resposta e a tela o
      // mostra como "e-mail de teste". Com backend, sai por e-mail/SMS.
      devCode = String(randomInt(100000, 1000000));
      adoption.term!.pendingCodes[actor.role] = {
        code: devCode,
        expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      };
      break;
    }
    case "sign": {
      error = requireStatus("termo");
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
        adoption.status = "entrega";
        await announce(
          adoption,
          "sistema",
          "Termo assinado pelas duas partes! Combinem aqui a entrega de " +
            `${adoption.petName}.`,
        );
      } else {
        await announce(
          adoption,
          isOng ? "ong" : "adopter",
          `${isOng ? "A ONG" : adoption.adopterName} assinou o termo. Falta a assinatura de ${isOng ? adoption.adopterName : "a ONG"}.`,
        );
      }
      break;
    }
    case "schedule_handover": {
      error = requireStatus("entrega");
      if (error) return error;
      const place = input.place?.trim();
      const at = new Date(input.at);
      if (!place) return fail(400, "Informe o local do encontro.");
      if (Number.isNaN(at.getTime()))
        return fail(400, "Informe a data e o horário do encontro.");
      if (at.getTime() < Date.now() - 60_000)
        return fail(400, "Escolha uma data e horário que ainda não passaram.");
      if (
        adoption.handover?.ongDeliveredAt ||
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
        ongDeliveredAt: null,
        adopterReceivedAt: null,
      };
      await announce(
        adoption,
        isOng ? "ong" : "adopter",
        `Encontro marcado: ${at.toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" })}, em ${place}. Vocês receberão um lembrete perto do horário.`,
      );
      break;
    }
    case "reveal_otp": {
      error = requireAdopter() ?? requireStatus("entrega");
      if (error) return error;
      if (!adoption.handover?.otp)
        return fail(409, "Marque o encontro para gerar o código.");
      // Protótipo: o código volta na resposta; com backend, vai por e-mail/SMS.
      devCode = adoption.handover.otp;
      break;
    }
    case "deliver": {
      error = requireOng() ?? requireStatus("entrega");
      if (error) return error;
      const handover = adoption.handover;
      if (!handover)
        return fail(409, "Marque o encontro antes de confirmar a entrega.");
      if (handover.ongDeliveredAt)
        return fail(409, "Você já confirmou a entrega.");
      if (handover.otpEnabled && handover.otp !== input.code?.trim()) {
        return fail(
          400,
          "Código incorreto. Peça ao adotante o código que aparece no app dele.",
        );
      }
      handover.ongDeliveredAt = now;
      if (handover.adopterReceivedAt) {
        await finalizeDelivery();
      } else {
        await announce(
          adoption,
          "ong",
          `A ONG confirmou a entrega de ${adoption.petName}. Falta ${adoption.adopterName} confirmar o recebimento.`,
        );
      }
      break;
    }
    case "confirm_receipt": {
      error = requireAdopter() ?? requireStatus("entrega");
      if (error) return error;
      const handover = adoption.handover;
      if (!handover)
        return fail(409, "Marque o encontro antes de confirmar o recebimento.");
      if (handover.adopterReceivedAt)
        return fail(409, "Você já confirmou o recebimento.");
      handover.adopterReceivedAt = now;
      if (handover.ongDeliveredAt) {
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
      error = requireAdopter() ?? requireStatus("acompanhamento");
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
      error = requireOng() ?? requireStatus("acompanhamento");
      if (error) return error;
      adoption.status = "concluida";
      await announce(
        adoption,
        "ong",
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
