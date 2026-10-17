/** Client-safe direct-Pix donation records. Adopters report transfers and NGOs confirm them against bank statements; funds never pass through the app. */

export type DonationStatus = "reported" | "confirmed" | "not_found";

export const DONATION_STATUS_LABEL: Record<DonationStatus, string> = {
  reported: "Aguardando a ONG confirmar",
  confirmed: "Confirmada pela ONG",
  not_found: "A ONG não localizou o Pix",
};

export type ReceivedDonation = {
  id: string;
  ngoId: string;
  /** Donor user identifier; absent from legacy or test donations. */
  donorId?: string;
  /** Donor display name, or the anonymous label when identity is hidden. */
  donorName: string;
  /** Amount in Brazilian reais. */
  amount: number;
  /** Legacy records without status are treated as confirmed. */
  status?: DonationStatus;
  /** Optional donor message to the NGO. */
  note?: string;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp of the NGO's response. */
  resolvedAt?: string;
};

/** Public NGO payment details needed by donors. */
export type DonationTarget = {
  ngoId: string;
  name: string;
  /** City and state abbreviation. */
  city: string;
  pixKey: string;
  bankAccount: string;
  /** Requested supplies such as food or blankets. */
  neededItems: string[];
};

export const DONATION_QUICK_AMOUNTS = [10, 25, 50, 100];
export const DONATION_MIN_AMOUNT = 1;
export const DONATION_MAX_AMOUNT = 50000;
export const DONATION_MAX_NOTE_LENGTH = 300;

export function donationStatusOf(donation: ReceivedDonation): DonationStatus {
  return donation.status ?? "confirmed";
}

/** Donation amount validation error, or null when valid. */
export function validateDonationAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < DONATION_MIN_AMOUNT) {
    return `Informe um valor de pelo menos R$ ${DONATION_MIN_AMOUNT}.`;
  }
  if (amount > DONATION_MAX_AMOUNT) {
    return "Para valores muito altos, combine direto com a ONG pela conversa.";
  }
  return null;
}

/** Parse Brazilian currency notation into a number; return NaN for invalid input. */
export function parseMoney(text: string): number {
  const clean = text.replace(/[^\d,.]/g, "");
  if (!clean) return NaN;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  return Math.round(Number(normalized) * 100) / 100;
}
