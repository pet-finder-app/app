import { promises as fs } from "node:fs";
import path from "node:path";
import {
  donationStatusOf,
  type DonationStatus,
  type DonationTarget,
  type ReceivedDonation,
} from "./donation";
import { readUsers, type StoredUser } from "./users";

/** Donation persistence adapter. A production backend can integrate actual Pix confirmation. */

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

/** All NGO donations, newest first, regardless of status. */
export async function listDonationsByNgo(
  ngoId: string,
): Promise<ReceivedDonation[]> {
  const donations = await readDonations();
  return donations.filter((d) => d.ngoId === ngoId).sort(byRecent);
}

/** Only confirmed receipts contribute to totals. */
export async function listConfirmedDonationsByNgo(
  ngoId: string,
): Promise<ReceivedDonation[]> {
  return (await listDonationsByNgo(ngoId)).filter(
    (d) => donationStatusOf(d) === "confirmed",
  );
}

export async function sumDonationsByNgo(ngoId: string): Promise<number> {
  const donations = await listConfirmedDonationsByNgo(ngoId);
  return donations.reduce((sum, d) => sum + d.amount, 0);
}

export async function listDonationsByDonor(
  donorId: string,
): Promise<ReceivedDonation[]> {
  const donations = await readDonations();
  return donations.filter((d) => d.donorId === donorId).sort(byRecent);
}

/** Record the adopter's reported transfer until the NGO confirms it. */
export async function createDonation(input: {
  ngoId: string;
  donorId: string;
  donorName: string;
  amount: number;
  note: string;
}): Promise<ReceivedDonation> {
  const donations = await readDonations();
  const donation: ReceivedDonation = {
    id: crypto.randomUUID(),
    ngoId: input.ngoId,
    donorId: input.donorId,
    donorName: input.donorName,
    amount: input.amount,
    status: "reported",
    ...(input.note ? { note: input.note } : {}),
    createdAt: new Date().toISOString(),
  };
  await writeDonations([...donations, donation]);
  return donation;
}

/** Only the owning NGO may resolve a reported donation, and only once. Resolved records are immutable. */
export async function resolveDonation(
  id: string,
  ngoId: string,
  status: Exclude<DonationStatus, "reported">,
): Promise<
  | { ok: true; donation: ReceivedDonation }
  | { ok: false; status: number; message: string }
> {
  const donations = await readDonations();
  const index = donations.findIndex((d) => d.id === id && d.ngoId === ngoId);
  if (index === -1) {
    return { ok: false, status: 404, message: "Doação não encontrada." };
  }
  if (donationStatusOf(donations[index]) !== "reported") {
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
  const ngo = user.ngo!;
  const { donation } = ngo.publicProfile;
  const { address } = ngo.legal;
  return {
    ngoId: user.id,
    name: ngo.legal.tradeName || user.name,
    city: [address.city, address.state].filter(Boolean).join("/"),
    pixKey: donation.pixKey.trim(),
    bankAccount: donation.bankAccount.trim(),
    neededItems: donation.neededItems,
  };
}

/** List verified NGOs with payment details. Direct lookups may still return an NGO without payment details so the UI can explain why donating is unavailable. */
export async function listDonationTargets(): Promise<DonationTarget[]> {
  const users = await readUsers();
  return users
    .filter(
      (u) => u.role === "ngo" && u.ngo?.verification.status === "verified",
    )
    .map(toTarget)
    .filter((t) => t.pixKey || t.bankAccount);
}

export async function getDonationTarget(
  ngoId: string,
): Promise<DonationTarget | undefined> {
  const users = await readUsers();
  const ngo = users.find(
    (u) =>
      u.id === ngoId &&
      u.role === "ngo" &&
      u.ngo?.verification.status === "verified",
  );
  return ngo ? toTarget(ngo) : undefined;
}
