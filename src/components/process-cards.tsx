"use client";

import {
  Button,
  Card,
  CardDescription,
  CardTitle,
  cn,
  Input,
  shadowSoft,
  Textarea,
} from "@/components/ui";
import type { AdoptionEvent, AdoptionTerm, SignerRole } from "@/lib/adoption";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Peças que o painel de adoção e o painel de entrega de pet à ONG têm em
 * comum: o mesmo processo visto de lados opostos (ficha → análise → termo →
 * entrega).
 */

export type ProcessRun = (
  body: { action: string } & Record<string, unknown>,
) => Promise<boolean>;

/**
 * Aviso de erro sempre à vista: fica fixo logo acima da barra de baixo, então
 * aparece perto de onde a pessoa tocou, não importa o quanto ela rolou a
 * página. Some sozinho quando o erro some ou ao tocar no X.
 */
export function ErrorToast({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  // Some sozinho depois de um tempo (quem ainda estiver lendo pode tocar de novo na ação).
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 9000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-start gap-2 rounded-2xl bg-red-700 px-4 py-3 text-sm font-semibold text-white",
        shadowSoft.lg,
      )}
    >
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar aviso"
        className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Botão que pede um "tem certeza?" antes de agir — para atos sem volta
 * (aprovar, assinar, confirmar entrega ou recebimento).
 */
export function ConfirmButton({
  label,
  question,
  confirmLabel,
  busy,
  disabled,
  variant,
  size,
  onConfirm,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  onConfirm: () => void | Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
    );
  }
  return (
    <div
      role="group"
      aria-label="Confirmação"
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-accent-yellow p-3",
        shadowSoft.sm,
      )}
    >
      <p className="text-sm font-bold text-neutral-900">{question}</p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Voltar
        </Button>
        <Button
          className="flex-1"
          variant={variant === "danger" ? "danger" : "primary"}
          loading={busy}
          onClick={async () => {
            await onConfirm();
            setOpen(false);
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

export function WaitingCard({ title, text }: { title: string; text: string }) {
  return (
    <Card className="gap-1">
      <CardTitle>{title}</CardTitle>
      <CardDescription>{text}</CardDescription>
    </Card>
  );
}

export function Answer({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-neutral-600">{label}</dt>
      <dd className="whitespace-pre-line">{value}</dd>
    </div>
  );
}

/** Linha do tempo horizontal: etapas concluídas, a atual em destaque e as próximas. */
export function ProcessSteps({
  steps,
  currentIndex,
  label,
}: {
  steps: { status: string; label: string }[];
  currentIndex: number;
  label: string;
}) {
  return (
    <ol className="flex items-center gap-1" aria-label={label}>
      {steps.map((step, index) => (
        <li
          key={step.status}
          aria-current={index === currentIndex ? "step" : undefined}
          className="flex min-w-0 flex-1 flex-col items-center gap-1"
        >
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs font-bold",
              index < currentIndex
                ? "bg-primary text-primary-foreground"
                : index === currentIndex
                  ? "bg-accent-yellow text-neutral-900"
                  : "bg-neutral-100 text-neutral-600",
            )}
          >
            {index < currentIndex ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={cn(
              "w-full truncate text-center text-[10px] font-semibold",
              index === currentIndex ? "text-neutral-900" : "text-neutral-600",
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function HistoryCard({ events }: { events: AdoptionEvent[] }) {
  return (
    <Card className="gap-2">
      <CardTitle>Histórico</CardTitle>
      <ul className="flex flex-col gap-2">
        {[...events].reverse().map((event) => (
          <li key={event.id} className="text-sm text-neutral-900">
            <span className="text-xs text-neutral-600">
              {new Date(event.at).toLocaleString("pt-BR")}
            </span>
            <br />
            {event.text}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Ler o termo até o fim, pedir o código e assinar. */
export function TermSignCard({
  term,
  title,
  ariaLabel,
  adopterName,
  role,
  busy,
  devCode,
  run,
  signLabel,
}: {
  term: AdoptionTerm;
  title: string;
  ariaLabel: string;
  /** Nome de quem faz o papel do adotante/tutor, para a lista de assinaturas. */
  adopterName: string;
  role: SignerRole;
  busy: boolean;
  devCode: string | null;
  run: ProcessRun;
  signLabel: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [readAll, setReadAll] = useState(false);
  const [code, setCode] = useState("");
  const mine = term.signatures.find((s) => s.role === role);
  const other = term.signatures.find((s) => s.role !== role);

  function checkScroll() {
    const el = boxRef.current;
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setReadAll(true);
    }
  }

  // Texto curto que cabe sem rolagem já conta como lido.
  useEffect(() => {
    const el = boxRef.current;
    if (el && el.scrollHeight <= el.clientHeight + 8) {
      setReadAll(true);
    }
  }, []);

  return (
    <Card className="gap-3">
      <CardTitle>{title}</CardTitle>
      <CardDescription>
        Leia o termo inteiro. A assinatura só libera no fim da leitura. Ela vale
        como assinatura eletrônica: registramos seu nome, CPF, data, hora e
        endereço de rede.
      </CardDescription>

      <div
        ref={boxRef}
        onScroll={checkScroll}
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        className="max-h-[55vh] overflow-y-auto rounded-2xl border border-stone-300 bg-neutral-100 p-3 text-sm whitespace-pre-line text-neutral-900"
      >
        {term.text}
      </div>
      {mine ? null : readAll ? (
        <p className="flex items-center gap-1.5 text-sm font-bold text-lime-800">
          <Check className="size-4" aria-hidden="true" />
          Você chegou ao fim do termo.
        </p>
      ) : (
        <p className="text-sm text-neutral-600">
          Role o texto acima até o fim para poder assinar.
        </p>
      )}

      <ul className="flex flex-col gap-1 text-sm">
        {(["ong", "adopter"] as const).map((r) => {
          const signature = term.signatures.find((s) => s.role === r);
          const who = r === "ong" ? "ONG" : adopterName;
          return (
            <li key={r} className="flex items-center gap-2 text-neutral-900">
              {signature ? (
                <>
                  <Check className="size-4 text-lime-800" aria-hidden="true" />
                  {who} assinou em{" "}
                  {new Date(signature.signedAt).toLocaleString("pt-BR")}
                </>
              ) : (
                <span className="text-neutral-600">Falta assinar: {who}</span>
              )}
            </li>
          );
        })}
      </ul>

      {mine ? (
        <p className="text-sm font-bold text-lime-800">
          Você já assinou. {other ? "" : "Falta a assinatura da outra parte."}
        </p>
      ) : (
        <>
          {!readAll ? null : (
            <>
              <Button
                variant="outline"
                loading={busy}
                onClick={() => void run({ action: "send_code" })}
              >
                {devCode
                  ? "Enviar outro código"
                  : "Enviar código de confirmação"}
              </Button>
              {devCode ? (
                <p
                  role="status"
                  className={cn(
                    "rounded-2xl bg-accent-yellow px-3 py-2 text-sm text-neutral-900",
                    shadowSoft.sm,
                  )}
                >
                  Protótipo: aqui apareceria o e-mail/SMS. Seu código é{" "}
                  <strong>{devCode}</strong> (vale por 10 minutos).
                </p>
              ) : null}
              <Input
                id="signCode"
                label="Código de 6 números"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
              <ConfirmButton
                label={signLabel}
                question="Ao assinar, você concorda com todo o termo e não poderá desfazer. Quer assinar?"
                confirmLabel="Sim, assinar"
                busy={busy}
                disabled={code.length !== 6}
                onConfirm={() => run({ action: "sign", code })}
              />
              {code.length !== 6 ? (
                <p className="text-xs text-neutral-600">
                  Para assinar: peça o código de confirmação e digite os 6
                  números.
                </p>
              ) : null}
            </>
          )}
        </>
      )}
    </Card>
  );
}

/** Cancelar o processo, com confirmação em duas etapas (e motivo opcional). */
export function CancelBox({
  triggerLabel,
  description,
  busy,
  run,
}: {
  triggerLabel: string;
  description: string;
  busy: boolean;
  run: ProcessRun;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
    );
  }
  return (
    <Card className="gap-3">
      <CardTitle>Tem certeza?</CardTitle>
      <CardDescription>{description}</CardDescription>
      <Textarea
        id="cancelNote"
        label="Quer explicar o motivo? (opcional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setOpen(false)}
        >
          Voltar
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          loading={busy}
          onClick={() => void run({ action: "cancel", note })}
        >
          Sim, cancelar
        </Button>
      </div>
    </Card>
  );
}
