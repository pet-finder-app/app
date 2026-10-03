/**
 * Doações em dinheiro que uma ONG recebeu de adotantes/apoiadores pela chave
 * Pix do perfil público. O Pix acontece fora do app (direto na conta da ONG);
 * aqui fica o registro: o adotante avisa que doou ("informada") e a ONG
 * confere no extrato e confirma. Hoje em `donations.json`, até existir um
 * backend que confirme os pagamentos de verdade.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export type DonationStatus = "informada" | "confirmada" | "nao_localizada";

export const DONATION_STATUS_LABEL: Record<DonationStatus, string> = {
  informada: "Aguardando a ONG confirmar",
  confirmada: "Confirmada pela ONG",
  nao_localizada: "A ONG não localizou o Pix",
};

export type ReceivedDonation = {
  id: string;
  ongId: string;
  /** `StoredUser.id` de quem doou. Ausente nas doações antigas/de teste. */
  donorId?: string;
  /** Nome mostrado à ONG. "Anônimo" quando o adotante escolhe não se identificar. */
  donorName: string;
  /** Em reais. */
  amount: number;
  /** Ausente nas doações antigas/de teste: conta como confirmada. */
  status?: DonationStatus;
  /** Recado opcional do adotante para a ONG. */
  note?: string;
  /** ISO datetime. */
  createdAt: string;
  /** ISO datetime em que a ONG respondeu. */
  resolvedAt?: string;
};

/** Dados públicos da ONG que o adotante precisa para doar. */
export type DonationTarget = {
  ongId: string;
  name: string;
  /** "Cidade/UF". */
  city: string;
  pixKey: string;
  bankAccount: string;
  /** Itens que a ONG aceita receber (ração, cobertor...). */
  neededItems: string[];
};

export const DONATION_QUICK_AMOUNTS = [10, 25, 50, 100];
export const DONATION_MIN_AMOUNT = 1;
export const DONATION_MAX_AMOUNT = 50000;
export const DONATION_MAX_NOTE_LENGTH = 300;

export function donationStatusOf(donation: ReceivedDonation): DonationStatus {
  return donation.status ?? "confirmada";
}

/** Mensagem do problema no valor, ou null se estiver certo. */
export function validateDonationAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount < DONATION_MIN_AMOUNT) {
    return `Informe um valor de pelo menos R$ ${DONATION_MIN_AMOUNT}.`;
  }
  if (amount > DONATION_MAX_AMOUNT) {
    return "Para valores muito altos, combine direto com a ONG pela conversa.";
  }
  return null;
}

/** "25", "25,50" ou "1.250,90" → número. NaN se não der para entender. */
export function parseMoney(text: string): number {
  const clean = text.replace(/[^\d,.]/g, "");
  if (!clean) return NaN;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  return Math.round(Number(normalized) * 100) / 100;
}
