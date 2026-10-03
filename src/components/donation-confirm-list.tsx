"use client";

import {
  Badge,
  Button,
  CardDescription,
  cn,
  FormError,
  shadowSoft,
} from "@/components/ui";
import {
  DONATION_STATUS_LABEL,
  donationStatusOf,
  type DonationStatus,
  type ReceivedDonation,
} from "@/lib/donation";
import { useRouter } from "next/navigation";
import { useState } from "react";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_TONE = {
  informada: "warning",
  confirmada: "success",
  nao_localizada: "danger",
} as const;

/**
 * Doações que os adotantes avisaram ter feito por Pix. A ONG confere no
 * extrato do banco (a lista vem do servidor e recarrega depois de cada resposta): "Recebi" soma no total do painel, "Não encontrei" só
 * registra que o Pix não apareceu.
 */
export function DonationConfirmList({
  donations,
}: {
  donations: ReceivedDonation[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(id: string, action: "confirm" | "not_found") {
    setError(null);
    setBusyId(id);
    try {
      const response = await fetch(`/api/doacoes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as {
        donation?: ReceivedDonation;
        message?: string;
      };
      if (!response.ok || !data.donation) {
        setError(data.message ?? "Não foi possível responder.");
        return;
      }
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setBusyId(null);
    }
  }

  if (donations.length === 0) {
    return (
      <p className="text-sm text-neutral-600">Nenhuma doação por aqui ainda.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <FormError id="donation-confirm-error" collapsible>
        {error}
      </FormError>
      <ul className="flex flex-col gap-2">
        {donations.map((donation) => {
          const status: DonationStatus = donationStatusOf(donation);
          return (
            <li
              key={donation.id}
              className={cn(
                "flex flex-col gap-2 rounded-2xl bg-white p-3",
                shadowSoft.md,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900">
                    {currency.format(donation.amount)} · {donation.donorName}
                  </p>
                  <CardDescription>
                    {new Date(donation.createdAt).toLocaleString("pt-BR")}
                  </CardDescription>
                </div>
                <Badge tone={STATUS_TONE[status]} size="sm">
                  {DONATION_STATUS_LABEL[status]}
                </Badge>
              </div>
              {donation.note ? (
                <p className="text-sm text-neutral-900 italic">
                  &ldquo;{donation.note}&rdquo;
                </p>
              ) : null}
              {status === "informada" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={busyId === donation.id}
                    onClick={() => void respond(donation.id, "confirm")}
                  >
                    Recebi o Pix
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={busyId === donation.id}
                    onClick={() => void respond(donation.id, "not_found")}
                  >
                    Não encontrei
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
