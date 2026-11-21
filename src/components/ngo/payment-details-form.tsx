"use client";
import { QueryStatus } from "@/components/backend/query-status";
import {
  Button,
  Checkbox,
  FormError,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { apiMutations, type PaymentDetailsInput } from "@/lib/api/mutations";
import { paymentDetailsOptions } from "@/lib/api/queries";
import type { PaymentDetails } from "@/lib/backend/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { VerificationLossDialog } from "./verification-loss-dialog";

type PaymentDetailsFormProps = {
  organizationId: string;
  isVerified: boolean;
};

/** Donation instructions published by the organization (direct transfers). */
export function PaymentDetailsForm({
  organizationId,
  isVerified,
}: PaymentDetailsFormProps) {
  const query = useQuery(paymentDetailsOptions(organizationId));
  return (
    <section aria-labelledby="payment-title" className="flex flex-col gap-3">
      <h2 id="payment-title" className="text-lg font-bold">
        Dados para doação
      </h2>
      <QueryStatus query={query} />
      {query.isSuccess ? (
        <PaymentDetailsFields
          key={organizationId}
          organizationId={organizationId}
          isVerified={isVerified}
          current={query.data}
        />
      ) : null}
    </section>
  );
}

type PaymentDetailsFieldsProps = PaymentDetailsFormProps & {
  current: PaymentDetails | null;
};

function PaymentDetailsFields({
  organizationId,
  isVerified,
  current,
}: PaymentDetailsFieldsProps) {
  const router = useRouter();
  const update = useMutation(apiMutations.updatePaymentDetails());
  const [draft, setDraft] = useState({
    method: current?.method ?? "pix",
    pixKey: current?.pixKey ?? "",
    bankName: current?.bankName ?? "",
    bankBranch: current?.bankBranch ?? "",
    bankAccount: current?.bankAccount ?? "",
    accountHolder: current?.accountHolder ?? "",
    instructions: current?.instructions ?? "",
    published: current?.published ?? false,
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const isPix = draft.method === "pix";
  const nextPixKey = isPix ? draft.pixKey.trim() : "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (update.isPending) return;
    setError(null);
    setIsSaved(false);
    // Mirrors Go: once details exist, any PIX key change, clearing it
    // included, sends a verified organization back to verification.
    if (isVerified && current && nextPixKey !== (current.pixKey ?? "")) {
      setIsConfirming(true);
      return;
    }
    void save();
  }

  async function save() {
    const details: PaymentDetailsInput = {
      method: isPix ? "pix" : "bank_transfer",
      instructions: draft.instructions.trim(),
      accountHolder: draft.accountHolder.trim(),
      published: draft.published,
      ...(isPix
        ? { pixKey: nextPixKey }
        : {
            bankName: draft.bankName.trim(),
            bankBranch: draft.bankBranch.trim(),
            bankAccount: draft.bankAccount.trim(),
          }),
    };
    try {
      await update.mutateAsync({ organizationId, details });
      setIsConfirming(false);
      setIsSaved(true);
      router.refresh();
    } catch (failure: unknown) {
      setIsConfirming(false);
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível salvar os dados para doação.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        id="payment-method"
        label="Forma de doação"
        value={draft.method}
        options={[
          { value: "pix", label: "PIX" },
          { value: "bank_transfer", label: "Transferência bancária" },
        ]}
        onChange={(event) =>
          setDraft({
            ...draft,
            method: event.target.value === "pix" ? "pix" : "bank_transfer",
          })
        }
      />
      {isPix ? (
        <Input
          id="payment-pix-key"
          label="Chave PIX"
          required
          maxLength={200}
          value={draft.pixKey}
          onChange={(event) =>
            setDraft({ ...draft, pixKey: event.target.value })
          }
        />
      ) : (
        <>
          <Input
            id="payment-bank-name"
            label="Banco"
            required
            maxLength={120}
            value={draft.bankName}
            onChange={(event) =>
              setDraft({ ...draft, bankName: event.target.value })
            }
          />
          <Input
            id="payment-bank-branch"
            label="Agência"
            required
            maxLength={30}
            value={draft.bankBranch}
            onChange={(event) =>
              setDraft({ ...draft, bankBranch: event.target.value })
            }
          />
          <Input
            id="payment-bank-account"
            label="Conta"
            required
            maxLength={50}
            value={draft.bankAccount}
            onChange={(event) =>
              setDraft({ ...draft, bankAccount: event.target.value })
            }
          />
        </>
      )}
      <Input
        id="payment-account-holder"
        label="Titular da conta"
        required
        minLength={2}
        maxLength={200}
        value={draft.accountHolder}
        onChange={(event) =>
          setDraft({ ...draft, accountHolder: event.target.value })
        }
      />
      <Textarea
        id="payment-instructions"
        label="Instruções para quem for doar"
        required
        maxLength={3000}
        value={draft.instructions}
        onChange={(event) =>
          setDraft({ ...draft, instructions: event.target.value })
        }
      />
      <Checkbox
        id="payment-published"
        label="Mostrar estes dados publicamente"
        checked={draft.published}
        onChange={(event) =>
          setDraft({ ...draft, published: event.target.checked })
        }
      />
      <FormError id="payment-error">{error}</FormError>
      {isSaved ? <p role="status">Dados para doação salvos.</p> : null}
      <Button type="submit" loading={update.isPending}>
        Salvar dados para doação
      </Button>
      {isConfirming ? (
        <VerificationLossDialog
          change={
            isPix ? "a chave PIX" : "a forma de doação e remover a chave PIX"
          }
          isBusy={update.isPending}
          onConfirm={() => void save()}
          onClose={() => setIsConfirming(false)}
        />
      ) : null}
    </form>
  );
}
