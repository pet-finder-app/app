"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import {
  Button,
  buttonClasses,
  Card,
  Checkbox,
  FormError,
  Input,
} from "@/components/ui";
import { backendPath, membersOptions } from "@/lib/api/queries";
import {
  agreementOptions,
  workflowKeys,
  workflowMutations,
} from "@/lib/api/workflows";
import type { AgreementResponse } from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Printer } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

type AgreementSigningProps = {
  agreementId: string;
  viewerId: string;
  /** Portuguese name of the person who signs opposite the organization. */
  userLabel: string;
  /** Whether the adoption/surrender still allows signatures in Go. */
  isSignable: boolean;
  /**
   * Organization whose members may be listed to name the representative;
   * pass it only when the viewer is a member or administrator.
   */
  memberOrganizationId?: string | null;
};

/** Hex SHA-256 of the exact UTF-8 text that Go hashed. */
async function sha256Hex(text: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function SignForm({ agreement }: { agreement: AgreementResponse }) {
  const id = useId();
  const sendCode = useMutation(workflowMutations.sendSigningCode());
  const sign = useMutation(workflowMutations.signAgreement());
  const [code, setCode] = useState("");
  const [hasAccepted, setHasAccepted] = useState(false);
  const isCodeValid = /^[0-9]{6}$/.test(code);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sign.isPending || !isCodeValid || !hasAccepted) return;
    sign.mutate(
      { id: agreement.id, code, sha256: agreement.sha256 },
      { onSuccess: () => setCode("") },
    );
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="flex flex-col gap-3 border-t border-border-light pt-4"
    >
      <h2 id={`${id}-title`} className="text-lg font-bold">
        Assinar o termo
      </h2>
      <ol className="list-decimal pl-5 text-sm text-neutral-600">
        <li>Peça um código de assinatura. Ele chega no seu e-mail.</li>
        <li>O código vale por 10 minutos e permite até 5 tentativas.</li>
        <li>Confirme que leu o termo e informe o código para assinar.</li>
      </ol>
      <Button
        variant="outline"
        loading={sendCode.isPending}
        onClick={() => sendCode.mutate(agreement.id)}
      >
        {sendCode.isSuccess
          ? "Enviar novo código por e-mail"
          : "Enviar código por e-mail"}
      </Button>
      {sendCode.isSuccess ? (
        <p role="status" className="text-sm">
          Código enviado. Confira seu e-mail, inclusive a caixa de spam.
        </p>
      ) : null}
      <FormError id={`${id}-code-error`} collapsible>
        {sendCode.error?.message}
      </FormError>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          id={`${id}-code`}
          label="Código de assinatura"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
          hint="6 números enviados por e-mail."
          errorId={`${id}-sign-error`}
          invalid={Boolean(sign.error)}
        />
        <Checkbox
          id={`${id}-accept`}
          checked={hasAccepted}
          onChange={(event) => setHasAccepted(event.target.checked)}
          label={`Li o termo acima e concordo com o texto identificado pelo código de integridade ${agreement.sha256.slice(0, 12)}…`}
        />
        <FormError id={`${id}-sign-error`}>{sign.error?.message}</FormError>
        <Button
          type="submit"
          loading={sign.isPending}
          disabled={!isCodeValid || !hasAccepted}
        >
          Assinar termo
        </Button>
      </form>
    </section>
  );
}

/**
 * Shows an immutable agreement, its signatures and, for the two named
 * signers, the e-mail code signing flow. Shared by adoptions and surrenders.
 */
export function AgreementSigning({
  agreementId,
  viewerId,
  userLabel,
  isSignable,
  memberOrganizationId,
}: AgreementSigningProps) {
  const query = useQuery(agreementOptions(agreementId));
  const agreement = query.data;
  const members = useQuery({
    ...membersOptions(memberOrganizationId ?? ""),
    enabled: Boolean(memberOrganizationId),
  });
  const digest = useQuery({
    queryKey: workflowKeys.agreementDigest(
      agreementId,
      agreement?.sha256 ?? "",
    ),
    queryFn: () => sha256Hex(agreement?.body ?? ""),
    enabled: Boolean(agreement),
    staleTime: Infinity,
  });
  const representative = members.data?.items.find(
    (member) => member.userId === agreement?.representativeId,
  );
  const representativeLabel = representative
    ? `${representative.displayName} (representante da ONG)`
    : "Representante da ONG";
  const isTampered =
    typeof digest.data === "string" && digest.data !== agreement?.sha256;

  if (!agreement) return <QueryStatus query={query} />;
  const parties = [
    {
      id: agreement.userId,
      label: agreement.userId === viewerId ? `${userLabel} (você)` : userLabel,
    },
    {
      id: agreement.representativeId,
      label:
        agreement.representativeId === viewerId
          ? `${representativeLabel} (você)`
          : representativeLabel,
    },
  ];
  const signatureOf = (signerId: string) =>
    agreement.signatures.find((signature) => signature.signerId === signerId);
  const isParty = parties.some((party) => party.id === viewerId);
  const hasSigned = Boolean(signatureOf(viewerId));
  const isComplete = parties.every((party) => signatureOf(party.id));

  return (
    <div className="flex flex-col gap-4">
      <Card as="article" aria-label="Texto do termo" className="gap-3">
        <p className="text-sm text-neutral-600">
          Criado em {formatDate(agreement.createdAt)}. O texto não pode ser
          alterado depois de criado.
        </p>
        <pre className="font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">
          {agreement.body}
        </pre>
        <p className="text-xs text-neutral-600">
          Código de integridade (SHA-256):{" "}
          <code className="break-all">{agreement.sha256}</code>
        </p>
        {digest.data === agreement.sha256 ? (
          <p className="flex items-center gap-2 text-xs text-neutral-600">
            <CheckCircle2
              className="size-4 text-accent-tertiary"
              aria-hidden="true"
            />
            O texto exibido corresponde ao código de integridade.
          </p>
        ) : null}
        {isTampered ? (
          <p role="alert" className="text-sm font-semibold text-red-700">
            O texto exibido não corresponde ao código de integridade. Não assine
            e avise a ONG.
          </p>
        ) : null}
      </Card>
      <a
        href={backendPath(
          `/v1/agreements/${encodeURIComponent(agreement.id)}/print`,
        )}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "outline" })}
      >
        <Printer className="size-4" aria-hidden="true" />
        Abrir versão para impressão
      </a>
      <section aria-labelledby="agreement-signatures" className="flex flex-col">
        <h2 id="agreement-signatures" className="text-lg font-bold">
          Assinaturas
        </h2>
        <ul className="flex flex-col gap-2">
          {parties.map((party) => {
            const signature = signatureOf(party.id);
            return (
              <li key={party.id} className="flex items-start gap-2">
                {signature ? (
                  <CheckCircle2
                    className="mt-0.5 size-5 shrink-0 text-accent-tertiary"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock
                    className="mt-0.5 size-5 shrink-0 text-neutral-600"
                    aria-hidden="true"
                  />
                )}
                <span>
                  {signature
                    ? `${party.label}: assinado em ${formatDate(signature.signedAt)}`
                    : `${party.label}: aguardando assinatura`}
                </span>
              </li>
            );
          })}
        </ul>
        {isComplete ? (
          <p role="status" className="mt-2 font-semibold">
            Termo assinado pelas duas partes.
          </p>
        ) : null}
      </section>
      {isParty && !hasSigned ? (
        isTampered ? null : isSignable ? (
          <SignForm agreement={agreement} />
        ) : (
          <p role="note">
            Este termo não pode mais ser assinado, porque o processo não está
            aprovado.
          </p>
        )
      ) : null}
    </div>
  );
}
