import { promises as fs } from "node:fs";
import path from "node:path";
import {
  donationStatusOf,
  type DonationStatus,
  type DonationTarget,
  type ReceivedDonation,
} from "./donation";
import { readUsers, type StoredUser } from "./users";

/**
 * Camada de acesso às doações recebidas — hoje um arquivo JSON, amanhã o
 * backend (que vai confirmar os pagamentos via Pix de verdade).
 */

const DONATIONS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "donations.json",
);

export async function readDonations(): Promise<ReceivedDonation[]> {
  const raw = await fs.readFile(DONATIONS_FILE, "utf-8");
  return (JSON.parse(raw) as { donations: ReceivedDonation[] }).donations;
}

async function writeDonations(donations: ReceivedDonation[]): Promise<void> {
  await fs.writeFile(
    DONATIONS_FILE,
    JSON.stringify({ donations }, null, 2) + "\n",
    "utf-8",
  );
}

const byRecent = (a: ReceivedDonation, b: ReceivedDonation) =>
  b.createdAt.localeCompare(a.createdAt);

/** Todas as doações da ONG, de qualquer status, mais recentes primeiro. */
export async function listDonationsByOng(
  ongId: string,
): Promise<ReceivedDonation[]> {
  const donations = await readDonations();
  return donations.filter((d) => d.ongId === ongId).sort(byRecent);
}

/** Só as que a ONG já confirmou: são as que entram nos totais. */
export async function listConfirmedDonationsByOng(
  ongId: string,
): Promise<ReceivedDonation[]> {
  return (await listDonationsByOng(ongId)).filter(
    (d) => donationStatusOf(d) === "confirmada",
  );
}

export async function sumDonationsByOng(ongId: string): Promise<number> {
  const donations = await listConfirmedDonationsByOng(ongId);
  return donations.reduce((sum, d) => sum + d.amount, 0);
}

export async function listDonationsByDonor(
  donorId: string,
): Promise<ReceivedDonation[]> {
  const donations = await readDonations();
  return donations.filter((d) => d.donorId === donorId).sort(byRecent);
}

/** O adotante avisa que fez o Pix: fica "informada" até a ONG conferir. */
export async function createDonation(input: {
  ongId: string;
  donorId: string;
  donorName: string;
  amount: number;
  note: string;
}): Promise<ReceivedDonation> {
  const donations = await readDonations();
  const donation: ReceivedDonation = {
    id: crypto.randomUUID(),
    ongId: input.ongId,
    donorId: input.donorId,
    donorName: input.donorName,
    amount: input.amount,
    status: "informada",
    ...(input.note ? { note: input.note } : {}),
    createdAt: new Date().toISOString(),
  };
  await writeDonations([...donations, donation]);
  return donation;
}

/**
 * A ONG responde sobre uma doação informada. Só a ONG dona pode, e só uma vez
 * (depois de confirmada ou recusada, o registro não muda).
 */
export async function resolveDonation(
  id: string,
  ongId: string,
  status: Exclude<DonationStatus, "informada">,
): Promise<
  | { ok: true; donation: ReceivedDonation }
  | { ok: false; status: number; message: string }
> {
  const donations = await readDonations();
  const index = donations.findIndex((d) => d.id === id && d.ongId === ongId);
  if (index === -1) {
    return { ok: false, status: 404, message: "Doação não encontrada." };
  }
  if (donationStatusOf(donations[index]) !== "informada") {
    return {
      ok: false,
      status: 409,
      message: "Você já respondeu esta doação.",
    };
  }
  const donation: ReceivedDonation = {
    ...donations[index],
    status,
    resolvedAt: new Date().toISOString(),
  };
  donations[index] = donation;
  await writeDonations(donations);
  return { ok: true, donation };
}

function toTarget(user: StoredUser): DonationTarget {
  const ong = user.ong!;
  const { donation } = ong.publicProfile;
  const { address } = ong.legal;
  return {
    ongId: user.id,
    name: ong.legal.tradeName || user.name,
    city: [address.city, address.state].filter(Boolean).join("/"),
    pixKey: donation.pixKey.trim(),
    bankAccount: donation.bankAccount.trim(),
    neededItems: donation.neededItems,
  };
}

/**
 * ONGs verificadas que aparecem na tela de doar. Quem ainda não cadastrou Pix
 * nem conta fica de fora da lista (mas `getDonationTarget` ainda a encontra,
 * para explicar o motivo a quem chegou por um link).
 */
export async function listDonationTargets(): Promise<DonationTarget[]> {
  const users = await readUsers();
  return users
    .filter(
      (u) => u.role === "ong" && u.ong?.verification.status === "verificada",
    )
    .map(toTarget)
    .filter((t) => t.pixKey || t.bankAccount);
}

export async function getDonationTarget(
  ongId: string,
): Promise<DonationTarget | undefined> {
  const users = await readUsers();
  const ong = users.find(
    (u) =>
      u.id === ongId &&
      u.role === "ong" &&
      u.ong?.verification.status === "verificada",
  );
  return ong ? toTarget(ong) : undefined;
}
