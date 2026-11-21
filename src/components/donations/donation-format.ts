/** Go limits for a reported transfer (`donationRequest` in donation_handlers.go). */
export const MIN_DONATION_CENTS = 1;
export const MAX_DONATION_CENTS = 1_000_000_000;
export const MAX_DONATION_NOTE = 2000;
export const MIN_DECISION_REASON = 5;
export const MAX_DECISION_REASON = 2000;

export type DonationStatus = "reported" | "confirmed" | "not_found";
export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  reported: "Aguardando confirmação da ONG",
  confirmed: "Confirmada pela ONG",
  not_found: "Não localizada pela ONG",
};
export const DONATION_STATUS_TONES: Record<
  DonationStatus,
  "warning" | "success" | "danger"
> = { reported: "warning", confirmed: "success", not_found: "danger" };

export function isDonationStatus(value: string): value is DonationStatus {
  return value === "reported" || value === "confirmed" || value === "not_found";
}
export function donationStatusLabel(value: string): string {
  return isDonationStatus(value)
    ? DONATION_STATUS_LABELS[value]
    : "Situação não informada";
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
/** Format integer cents as BRL without dividing floats into the display. */
export function formatBrl(cents: number): string {
  return currency.format(cents / 100);
}

export type AmountParseResult =
  { ok: true; cents: number } | { ok: false; error: string };

// "1234", "1.234", "1.234.567", optionally followed by ",5" or ",56".
const BRAZILIAN_AMOUNT = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;
// "50.5" or "50.00": a single dot followed by one or two digits is a decimal.
const DOT_DECIMAL_AMOUNT = /^(\d+)\.(\d{1,2})$/;

/**
 * Convert a Brazilian amount ("50", "50,00", "1.234,56", "R$ 10,5") to integer
 * cents using string arithmetic only, so no floating point error is possible.
 */
export function parseBrlAmount(input: string): AmountParseResult {
  const value = input
    .replace(/^\s*R\$\s*/i, "")
    .replace(/\s/g, "")
    .trim();
  if (!value) return { ok: false, error: "Informe o valor transferido." };
  // "1.234" is read as one thousand (pt-BR grouping) before "1.23" as decimal.
  const match = BRAZILIAN_AMOUNT.exec(value) ?? DOT_DECIMAL_AMOUNT.exec(value);
  if (!match)
    return {
      ok: false,
      error: "Use o formato brasileiro, como 50, 50,00 ou 1.234,56.",
    };
  const integerDigits = match[1].replace(/\./g, "").replace(/^0+(?=\d)/, "");
  const fraction = (match[2] ?? "").padEnd(2, "0");
  // More than ten integer digits is always above the Go maximum.
  if (integerDigits.length > 10)
    return { ok: false, error: "O valor máximo é R$ 10.000.000,00." };
  const cents = Number(integerDigits) * 100 + Number(fraction);
  if (cents < MIN_DONATION_CENTS)
    return { ok: false, error: "O valor deve ser maior que zero." };
  if (cents > MAX_DONATION_CENTS)
    return { ok: false, error: "O valor máximo é R$ 10.000.000,00." };
  return { ok: true, cents };
}

export type TransferDateResult =
  { ok: true; iso: string } | { ok: false; error: string };

/** Convert a `datetime-local` value (browser time zone) to an ISO instant. */
export function parseTransferredAt(
  value: string,
  now: Date = new Date(),
): TransferDateResult {
  if (!value)
    return { ok: false, error: "Informe quando a transferência foi feita." };
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return { ok: false, error: "Informe uma data e hora válidas." };
  if (date.getTime() > now.getTime())
    return {
      ok: false,
      error: "A data da transferência não pode estar no futuro.",
    };
  return { ok: true, iso: date.toISOString() };
}
