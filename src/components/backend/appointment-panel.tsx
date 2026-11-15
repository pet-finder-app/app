"use client";
import { Button, FormError, Input, Select, Textarea } from "@/components/ui";
import { apiMutations, type AppointmentInput } from "@/lib/api/mutations";
import {
  applicationAppointmentsOptions,
  appointmentOptions,
} from "@/lib/api/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { formatDate } from "./labels";
import { QueryStatus } from "./query-status";

const purposeSchema = z.enum([
  "interview",
  "home_visit",
  "meet_and_greet",
  "delivery",
  "follow_up",
]);
const PURPOSE_LABELS: Record<string, string> = {
  interview: "Entrevista",
  home_visit: "Visita",
  meet_and_greet: "Conhecer o animal",
  delivery: "Entrega",
  follow_up: "Acompanhamento",
};
const STATUS_LABELS: Record<string, string> = {
  proposed: "Proposto",
  scheduled: "Agendado",
  cancelled: "Cancelado",
  completed: "Concluído",
  no_show: "Não compareceu",
};

type AppointmentCardProps = {
  id: string;
  isApplicant: boolean;
  canManage: boolean;
};
function AppointmentCard({ id, isApplicant, canManage }: AppointmentCardProps) {
  const query = useQuery(appointmentOptions(id));
  const update = useMutation(apiMutations.updateAppointment());
  const otp = useMutation(apiMutations.issueOtp());
  const confirm = useMutation(apiMutations.confirmAppointment());
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const appointment = query.data?.appointment;
  const confirmations = query.data?.confirmations ?? [];
  const hasConfirmed = confirmations.some(
    (item) => item.party === (isApplicant ? "adopter" : "organization"),
  );
  const isBusy = update.isPending || otp.isPending || confirm.isPending;
  return (
    <li className="flex flex-col gap-3 border-b border-border-light pb-4">
      <QueryStatus query={query} />
      {appointment ? (
        <>
          <h3 className="font-bold">
            {PURPOSE_LABELS[appointment.kind] ?? "Encontro"} ·{" "}
            {STATUS_LABELS[appointment.status] ?? "Situação não informada"}
          </h3>
          <p>
            {formatDate(appointment.startsAt)} até{" "}
            {formatDate(appointment.endsAt)}
          </p>
          <p>
            {appointment.locationName} · {appointment.address}
          </p>
          {appointment.instructions ? <p>{appointment.instructions}</p> : null}
          {appointment.cancellationReason ? (
            <p>Motivo do cancelamento: {appointment.cancellationReason}</p>
          ) : null}
          <ul className="flex flex-col gap-1">
            {confirmations.map((item) => (
              <li key={item.id}>
                {item.confirmation === "animal_delivered"
                  ? "Entrega confirmada pela ONG"
                  : item.confirmation === "animal_received"
                    ? "Recebimento confirmado pelo adotante"
                    : "Confirmação registrada"}{" "}
                · {formatDate(item.confirmedAt)}
              </li>
            ))}
          </ul>
          {canManage && appointment.status === "proposed" ? (
            <Button
              loading={update.isPending}
              disabled={isBusy}
              onClick={() =>
                update.mutate({ id, changes: { status: "scheduled" } })
              }
            >
              Confirmar agendamento
            </Button>
          ) : null}
          {canManage &&
          ["proposed", "scheduled"].includes(appointment.status) ? (
            <form
              className="flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!isBusy && reason.trim().length >= 5)
                  update.mutate({
                    id,
                    changes: { status: "cancelled", reason: reason.trim() },
                  });
              }}
            >
              <Input
                id={`appointment-cancel-${id}`}
                label="Motivo do cancelamento"
                required
                minLength={5}
                maxLength={2000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <Button
                type="submit"
                variant="danger-ghost"
                loading={update.isPending}
                disabled={isBusy || reason.trim().length < 5}
              >
                Cancelar encontro
              </Button>
            </form>
          ) : null}
          {appointment.kind === "delivery" &&
          appointment.status === "scheduled" ? (
            <>
              {canManage ? (
                <>
                  <Button
                    variant="outline"
                    loading={otp.isPending}
                    disabled={isBusy}
                    onClick={() => otp.mutate(id)}
                  >
                    Gerar código de entrega
                  </Button>
                  {otp.data ? (
                    <p role="status">
                      Código: <strong>{otp.data.code}</strong>. Válido até{" "}
                      {formatDate(otp.data.expiresAt)}.
                    </p>
                  ) : null}
                </>
              ) : null}
              {!hasConfirmed && (isApplicant || canManage) ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!isBusy)
                      confirm.mutate({
                        id,
                        type: isApplicant ? "receipt" : "delivery",
                        ...(isApplicant ? { otpCode: code } : {}),
                      });
                  }}
                >
                  {isApplicant ? (
                    <Input
                      id={`appointment-code-${id}`}
                      label="Código informado pela organização"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      required
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      errorId={`appointment-error-${id}`}
                    />
                  ) : null}
                  <Button
                    type="submit"
                    loading={confirm.isPending}
                    disabled={isBusy || (isApplicant && !/^\d{6}$/.test(code))}
                  >
                    {isApplicant
                      ? "Confirmar recebimento"
                      : "Confirmar entrega"}
                  </Button>
                </form>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
      <FormError id={`appointment-error-${id}`}>
        {update.error?.message ?? otp.error?.message ?? confirm.error?.message}
      </FormError>
    </li>
  );
}

type AppointmentFormProps = { applicationId: string };
function AppointmentForm({ applicationId }: AppointmentFormProps) {
  const create = useMutation(apiMutations.createAppointment());
  const [draft, setDraft] = useState({
    purpose: purposeSchema.parse("meet_and_greet"),
    startsAt: "",
    endsAt: "",
    locationName: "",
    address: "",
    instructions: "",
  });
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending) return;
    setError(null);
    try {
      const startsAt = new Date(draft.startsAt);
      const endsAt = new Date(draft.endsAt);
      if (
        !Number.isFinite(startsAt.getTime()) ||
        !Number.isFinite(endsAt.getTime()) ||
        startsAt <= new Date() ||
        endsAt <= startsAt
      ) {
        setError("Informe um início futuro e um fim posterior ao início.");
        return;
      }
      const input: AppointmentInput = {
        ...draft,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      await create.mutateAsync({ applicationId, appointment: input });
      setDraft({ ...draft, startsAt: "", endsAt: "" });
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Não foi possível agendar.",
      );
    }
  }
  return (
    <>
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
      <FormError id="appointment-create-error">{error}</FormError>
      {create.isSuccess ? <p role="status">Encontro proposto.</p> : null}
    </>
  );
}

type AppointmentPanelProps = {
  applicationId: string;
  isApplicant: boolean;
  canSchedule: boolean;
};
export function AppointmentPanel({
  applicationId,
  isApplicant,
  canSchedule,
}: AppointmentPanelProps) {
  const query = useQuery(applicationAppointmentsOptions(applicationId));
  return (
    <section className="flex flex-col gap-3 border-t border-border-light pt-4">
      <h2 className="text-lg font-bold">Encontros e entrega</h2>
      <QueryStatus query={query} />
      {query.data && !query.data.items.length ? (
        <p>Nenhum encontro agendado.</p>
      ) : null}
      <ul className="flex flex-col gap-4">
        {query.data?.items.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            id={appointment.id}
            isApplicant={isApplicant}
            canManage={canSchedule}
          />
        ))}
      </ul>
      {canSchedule && query.data && !query.error ? (
        <details>
          <summary className="cursor-pointer py-3 font-bold">
            Propor novo encontro
          </summary>
          <AppointmentForm applicationId={applicationId} />
        </details>
      ) : null}
    </section>
  );
}
