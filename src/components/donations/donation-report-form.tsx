"use client";
import {
  Button,
  Checkbox,
  FormError,
  Input,
  LinkButton,
  Textarea,
} from "@/components/ui";
import { donationMutations } from "@/lib/api/donations";
import {
  DOCUMENT_TYPES,
  MAX_UPLOAD_BYTES,
  uploadMedia,
} from "@/lib/api/mutations";
import type { DonationResponse } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  formatBrl,
  MAX_DONATION_NOTE,
  parseBrlAmount,
  parseTransferredAt,
} from "./donation-format";

type DonationReportFormProps = {
  organizationId: string;
  organizationName: string;
};

const ERROR_ID = "donation-report-error";

/** Report a transfer already made outside Petfinder (`POST .../donations`). */
export function DonationReportForm({
  organizationId,
  organizationName,
}: DonationReportFormProps) {
  const report = useMutation(donationMutations.report());
  const [amount, setAmount] = useState("");
  const [transferredAt, setTransferredAt] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  // Reuse the stored receipt if Go rejects the report and the person retries.
  const [uploaded, setUploaded] = useState<{ file: File; id: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<DonationResponse | null>(null);
  const isBusy = isUploading || report.isPending;
  const parsedAmount = amount ? parseBrlAmount(amount) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    const cents = parseBrlAmount(amount);
    if (!cents.ok) return setError(cents.error);
    const date = parseTransferredAt(transferredAt);
    if (!date.ok) return setError(date.error);
    if (receipt && receipt.size > MAX_UPLOAD_BYTES)
      return setError("O comprovante deve ter no máximo 10 MB.");
    setError(null);
    try {
      let receiptMediaId: string | undefined;
      if (receipt && uploaded?.file === receipt) receiptMediaId = uploaded.id;
      else if (receipt) {
        setIsUploading(true);
        // Go accepts receipts uploaded with the private "document" purpose.
        receiptMediaId = (await uploadMedia(receipt, "document")).id;
        setUploaded({ file: receipt, id: receiptMediaId });
        setIsUploading(false);
      }
      const trimmedNote = note.trim();
      setCreated(
        await report.mutateAsync({
          organizationId,
          amountCents: cents.cents,
          transferredAt: date.iso,
          anonymous: isAnonymous,
          ...(receiptMediaId ? { receiptMediaId } : {}),
          ...(trimmedNote ? { note: trimmedNote } : {}),
        }),
      );
    } catch (failure: unknown) {
      setIsUploading(false);
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível informar a doação.",
      );
    }
  }

  if (created)
    return (
      <section
        aria-labelledby="donation-reported"
        className="flex flex-col gap-3"
      >
        <h2 id="donation-reported" className="text-lg font-bold">
          Doação informada
        </h2>
        <p role="status">
          Registramos sua transferência de {formatBrl(created.amountCents)} para{" "}
          {organizationName}. Ela fica aguardando a confirmação da ONG.
        </p>
        <LinkButton
          href={`/adopter/donate/history/${encodeURIComponent(created.id)}`}
        >
          Acompanhar doação
        </LinkButton>
        <LinkButton href="/adopter/donate" variant="outline">
          Ver minhas doações
        </LinkButton>
      </section>
    );

  return (
    <section aria-labelledby="donation-report" className="flex flex-col gap-3">
      <h2 id="donation-report" className="text-lg font-bold">
        Já transferiu? Informe a doação
      </h2>
      <p className="text-sm text-neutral-600">
        Este formulário não faz pagamentos. Ele apenas avisa a ONG sobre uma
        transferência que você já fez, para que ela confira e confirme.
      </p>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Input
          id="donation-amount"
          label="Valor transferido (R$)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="50,00"
          required
          hint={
            parsedAmount?.ok
              ? `Valor informado: ${formatBrl(parsedAmount.cents)}`
              : "Exemplos: 50, 50,00 ou 1.234,56"
          }
          invalid={parsedAmount ? !parsedAmount.ok : false}
          errorId={ERROR_ID}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          id="donation-transferred-at"
          label="Data e hora da transferência"
          type="datetime-local"
          required
          value={transferredAt}
          onChange={(event) => setTransferredAt(event.target.value)}
        />
        <label
          htmlFor="donation-receipt"
          className="flex flex-col gap-1 text-sm font-semibold"
        >
          Comprovante (opcional, visível apenas para você e a ONG)
          <input
            id="donation-receipt"
            type="file"
            accept={DOCUMENT_TYPES.join(",")}
            className="text-sm font-normal"
            onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
          />
          <span className="font-normal text-neutral-600">
            PDF, JPEG, PNG ou WebP de até 10 MB.
          </span>
        </label>
        <Checkbox
          id="donation-anonymous"
          label="Doar anonimamente (a ONG não verá seu nome)"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
        />
        {isAnonymous ? (
          <p role="note" className="text-sm text-neutral-600">
            A ONG precisa do comprovante para confirmar a transferência, e ele
            costuma mostrar o nome de quem pagou. Para continuar anônimo, envie
            sem comprovante ou cubra seu nome antes de anexar.
          </p>
        ) : null}
        <Textarea
          id="donation-note"
          label="Mensagem para a ONG (opcional)"
          maxLength={MAX_DONATION_NOTE}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <FormError id={ERROR_ID}>{error}</FormError>
        <Button
          type="submit"
          loading={isBusy}
          loadingLabel={isUploading ? "Enviando comprovante..." : "Enviando..."}
        >
          Informar doação
        </Button>
      </form>
    </section>
  );
}
