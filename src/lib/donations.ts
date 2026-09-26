import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReceivedDonation } from "./donation";

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

export async function listDonationsByOng(
  ongId: string,
): Promise<ReceivedDonation[]> {
  const donations = await readDonations();
  return donations
    .filter((d) => d.ongId === ongId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function sumDonationsByOng(ongId: string): Promise<number> {
  const donations = await listDonationsByOng(ongId);
  return donations.reduce((sum, d) => sum + d.amount, 0);
}
