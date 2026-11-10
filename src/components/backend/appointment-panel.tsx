"use client";
import { Button, FormError, Input, Select, Textarea } from "@/components/ui";
import { apiMutations, type AppointmentInput } from "@/lib/api/mutations";
import type { Appointment } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { formatDate } from "./labels";

const purposeSchema = z.enum([
  "interview",
  "home_visit",
  "meet_and_greet",
  "delivery",
  "follow_up",
]);
export function AppointmentPanel({
  applicationId,
  isApplicant,
}: {
  applicationId: string;
  isApplicant: boolean;
}) {
  const create = useMutation(apiMutations.createAppointment());
  const update = useMutation(apiMutations.updateAppointment());
  const otp = useMutation(apiMutations.issueOtp());
  const confirm = useMutation(apiMutations.confirmAppointment());
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [draft, setDraft] = useState({
    purpose: purposeSchema.parse("meet_and_greet"),
    startsAt: "",
    endsAt: "",
    locationName: "",
    address: "",
    instructions: "",
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const input: AppointmentInput = {
        ...draft,
        startsAt: new Date(draft.startsAt).toISOString(),
        endsAt: new Date(draft.endsAt).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      setAppointment(
        await create.mutateAsync({ applicationId, appointment: input }),
      );
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Não foi possível agendar.",
      );
    }
  }
  return (
    <section className="flex flex-col gap-3 border-t border-border-light pt-4">
      <h2 className="text-lg font-bold">Encontros e entrega</h2>
      <p className="text-sm">
        A consulta de agendamentos anteriores ainda não está disponível aqui.
        Combine com a organização antes de criar outro encontro.
      </p>
      {!appointment ? (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Select
            id="appointment-purpose"
            label="Tipo de encontro"
            value={draft.purpose}
            options={[
              { value: "interview", label: "Entrevista" },
              { value: "home_visit", label: "Visita" },
              { value: "meet_and_greet", label: "Conhecer o animal" },
              { value: "delivery", label: "Entrega" },
              { value: "follow_up", label: "Acompanhamento" },
            ]}
            onChange={(event) =>
              setDraft({
                ...draft,
                purpose: purposeSchema.parse(event.target.value),
              })
            }
          />
          <Input
            id="appointment-start"
            label="Início"
            type="datetime-local"
            required
            value={draft.startsAt}
            onChange={(event) =>
              setDraft({ ...draft, startsAt: event.target.value })
            }
          />
          <Input
            id="appointment-end"
            label="Fim"
            type="datetime-local"
            required
            value={draft.endsAt}
            onChange={(event) =>
              setDraft({ ...draft, endsAt: event.target.value })
            }
          />
          <Input
            id="appointment-place"
            label="Local"
            required
            maxLength={200}
            value={draft.locationName}
            onChange={(event) =>
              setDraft({ ...draft, locationName: event.target.value })
            }
          />
          <Input
            id="appointment-address"
            label="Endereço"
            required
            maxLength={500}
            value={draft.address}
            onChange={(event) =>
              setDraft({ ...draft, address: event.target.value })
            }
          />
          <Textarea
            id="appointment-instructions"
            label="Orientações"
            maxLength={2000}
            value={draft.instructions}
            onChange={(event) =>
              setDraft({ ...draft, instructions: event.target.value })
            }
          />
          <Button type="submit" loading={create.isPending}>
            Propor encontro
          </Button>
        </form>
      ) : (
        <>
          <p>
            {appointment.locationName} · {formatDate(appointment.startsAt)}
          </p>
          <p>{appointment.address}</p>
          {appointment.status !== "scheduled" ? (
            <Button
              loading={update.isPending}
              onClick={() =>
                update.mutate(
                  { id: appointment.id, changes: { status: "scheduled" } },
                  { onSuccess: setAppointment },
                )
              }
            >
              Confirmar agendamento
            </Button>
          ) : null}
          {appointment.kind === "delivery" &&
          appointment.status === "scheduled" ? (
            <>
              <Button
                variant="outline"
                loading={otp.isPending}
                onClick={() => otp.mutate(appointment.id)}
              >
                Gerar código de entrega
              </Button>
              {otp.data ? (
                <p role="status">
                  Código: <strong>{otp.data.code}</strong>. Válido até{" "}
                  {formatDate(otp.data.expiresAt)}.
                </p>
              ) : null}
              {isApplicant ? (
                <Input
                  id="appointment-code"
                  label="Código informado pela organização"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                />
              ) : null}
              <Button
                loading={confirm.isPending}
                disabled={isApplicant && !/^\d{6}$/.test(code)}
                onClick={() =>
                  confirm.mutate({
                    id: appointment.id,
                    type: isApplicant ? "receipt" : "delivery",
                    ...(isApplicant ? { otpCode: code } : {}),
                  })
                }
              >
                {isApplicant ? "Confirmar recebimento" : "Confirmar entrega"}
              </Button>
              {confirm.isSuccess ? (
                <p role="status">Confirmação registrada.</p>
              ) : null}
            </>
          ) : null}
        </>
      )}
      <FormError id="appointment-error">
        {error ??
          update.error?.message ??
          otp.error?.message ??
          confirm.error?.message}
      </FormError>
    </section>
  );
}
