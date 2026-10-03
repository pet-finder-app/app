"use client";

import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  cn,
  FormError,
  iconSize,
  Input,
  LinkButton,
  pressSoft,
  shadowSoft,
  Textarea,
} from "@/components/ui";
import {
  DONATION_MAX_NOTE_LENGTH,
  DONATION_QUICK_AMOUNTS,
  DONATION_STATUS_LABEL,
  parseMoney,
  validateDonationAmount,
  type DonationTarget,
  type ReceivedDonation,
} from "@/lib/donation";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ERROR_ID = "donation-error";
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type DonationFormProps = {
  target: DonationTarget;
};

/**
 * Doar para uma ONG: o dinheiro vai direto para a conta dela (Pix), fora do
 * app. O adotante escolhe o valor, copia a chave, paga no banco e volta para
 * avisar a ONG, que confere no extrato e confirma.
 */
export function DonationForm({ target }: DonationFormProps) {
  const router = useRouter();
  const [amountText, setAmountText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState<"pix" | "bank" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ReceivedDonation | null>(null);

  const amount = parseMoney(amountText);
  const hasAmount = Number.isFinite(amount) && amount > 0;

  async function copy(kind: "pix" | "bank", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2500);
    } catch {
      setError("Não deu para copiar. Selecione o texto e copie à mão.");
    }
  }

  async function submit() {
    setError(null);
    const problem = validateDonationAmount(amount);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/doacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ongId: target.ongId,
          amount,
          anonymous,
          note,
        }),
      });
      const data = (await response.json()) as {
        donation?: ReceivedDonation;
        message?: string;
      };
      if (!response.ok || !data.donation) {
        setError(data.message ?? "Não foi possível registrar.");
        return;
      }
      setDone(data.donation);
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card className="gap-3" role="status">
        <CardTitle>Obrigado por ajudar!</CardTitle>
        <p className="text-sm text-neutral-900">
          Avisamos {target.name} sobre a sua doação de{" "}
          <strong>{currency.format(done.amount)}</strong>. Quando a ONG conferir
          o Pix no extrato, ela confirma aqui no app.
        </p>
        <p className="text-xs text-neutral-600">
          Situação: {DONATION_STATUS_LABEL.informada}.
        </p>
        <LinkButton href="/adotante/doar" variant="outline">
          Voltar para doações
        </LinkButton>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="gap-3">
        <CardTitle>1. Quanto você quer doar?</CardTitle>
        <div
          role="group"
          aria-label="Valores sugeridos"
          className="grid grid-cols-4 gap-2"
        >
          {DONATION_QUICK_AMOUNTS.map((value) => {
            const selected = amount === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setAmountText(String(value))}
                className={cn(
                  "min-h-11 rounded-2xl text-sm font-bold focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none",
                  shadowSoft.sm,
                  pressSoft.sm,
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-neutral-900",
                )}
              >
                R$ {value}
              </button>
            );
          })}
        </div>
        <Input
          id="donationAmount"
          label="Ou digite outro valor (em reais)"
          inputMode="decimal"
          placeholder="Ex.: 35,00"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          invalid={Boolean(error)}
          errorId={ERROR_ID}
        />
      </Card>

      <Card className="gap-3">
        <CardTitle>2. Faça o Pix no seu banco</CardTitle>
        <CardDescription>
          O dinheiro vai direto para a conta de {target.name}. O Petfinder não
          recebe nem guarda o valor.
        </CardDescription>

        {target.pixKey ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-neutral-600">Chave Pix</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm font-bold break-all text-neutral-900">
                {target.pixKey}
              </code>
              <Button
                variant="outline"
                size="md"
                onClick={() => void copy("pix", target.pixKey)}
                aria-label={
                  copied === "pix" ? "Chave Pix copiada" : "Copiar chave Pix"
                }
              >
                {copied === "pix" ? (
                  <Check className={iconSize.md} aria-hidden="true" />
                ) : (
                  <Copy className={iconSize.md} aria-hidden="true" />
                )}
                {copied === "pix" ? "Copiada" : "Copiar"}
              </Button>
            </div>
          </div>
        ) : null}

        {target.bankAccount ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-neutral-600">
              Conta para transferência
            </p>
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm whitespace-pre-line text-neutral-900">
                {target.bankAccount}
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => void copy("bank", target.bankAccount)}
                aria-label={
                  copied === "bank" ? "Conta copiada" : "Copiar dados da conta"
                }
              >
                {copied === "bank" ? (
                  <Check className={iconSize.md} aria-hidden="true" />
                ) : (
                  <Copy className={iconSize.md} aria-hidden="true" />
                )}
                {copied === "bank" ? "Copiada" : "Copiar"}
              </Button>
            </div>
          </div>
        ) : null}

        {hasAmount ? (
          <p className="text-sm text-neutral-900">
            Valor a pagar: <strong>{currency.format(amount)}</strong>
          </p>
        ) : (
          <p className="text-sm text-neutral-600">
            Escolha o valor acima para ver o total.
          </p>
        )}

        <p
          className={cn(
            "flex items-start gap-2 rounded-2xl bg-accent-yellow px-3 py-2 text-xs text-neutral-900",
            shadowSoft.sm,
          )}
        >
          <ShieldAlert
            className={cn(iconSize.sm, "mt-0.5 shrink-0")}
            aria-hidden="true"
          />
          Confira o nome do recebedor antes de confirmar o Pix. Use somente os
          dados desta tela: o Petfinder e as ONGs não pedem pagamento por
          mensagem.
        </p>
      </Card>

      <Card className="gap-3">
        <CardTitle>3. Avise a ONG</CardTitle>
        <CardDescription>
          Depois de pagar, toque no botão abaixo. Assim a ONG sabe de quem é o
          Pix e agradece.
        </CardDescription>
        <Textarea
          id="donationNote"
          label="Recado para a ONG (opcional)"
          maxLength={DONATION_MAX_NOTE_LENGTH}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Checkbox
          id="donationAnonymous"
          label="Quero doar sem aparecer o meu nome"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        <FormError id={ERROR_ID} collapsible>
          {error}
        </FormError>
        <Button
          loading={busy}
          loadingLabel="REGISTRANDO..."
          disabled={!hasAmount}
          onClick={() => void submit()}
        >
          JÁ FIZ O PIX
        </Button>
      </Card>
    </div>
  );
}
