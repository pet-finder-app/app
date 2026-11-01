"use client";

import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { api, result, type Schema } from "@/lib/api/client";
import { keys, useApiMutation } from "@/lib/api/queries";
import { useState } from "react";
import { dateLabel, ErrorMessage, field } from "./common";

export function Appointments({
  applicationId,
  organization,
}: {
  applicationId: string;
  organization: boolean;
}) {
  const [appointmentId, setAppointmentId] = useState("");
  const [updateStatus, setUpdateStatus] = useState("scheduled");
  const [appointment, setAppointment] = useState<Schema["Appointment"] | null>(
    null,
  );
  const create = useApiMutation(
    (body: Schema["AppointmentRequest"]) =>
      result(
        api.POST("/v1/applications/{applicationId}/appointments", {
          params: { path: { applicationId } },
          body,
        }),
      ),
    [keys.applications],
  );
  const change = useApiMutation(
    (body: Schema["UpdateAppointmentRequest"]) =>
      result(
        api.PATCH("/v1/appointments/{appointmentId}", {
          params: { path: { appointmentId } },
          body,
        }),
      ),
    [keys.applications],
  );
  const confirm = useApiMutation(
    (body: Schema["AppointmentConfirmationRequest"]) =>
      result(
        api.POST("/v1/appointments/{appointmentId}/confirmations", {
          params: { path: { appointmentId } },
          body,
        }),
      ),
    [keys.applications, keys.animals],
  );
  const otp = useApiMutation(
    () =>
      result(
        api.POST("/v1/appointments/{appointmentId}/otp", {
          params: { path: { appointmentId } },
        }),
      ),
    [],
  );
  const resetSensitive = () => {
    otp.reset();
    confirm.reset();
    change.reset();
    setAppointment(null);
  };
  return (
    <Card>
      <h2 className="font-bold">Encontros e entrega</h2>
      <p className="text-sm">
        Use a conversa para combinar o encontro e compartilhar o ID do
        agendamento. O serviço ainda não permite listar agendamentos anteriores.
      </p>
      {organization && (
        <details>
          <summary className="cursor-pointer font-bold">
            Agendar um encontro
          </summary>
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              create.mutate(
                {
                  purpose: field(
                    form,
                    "purpose",
                  ) as Schema["AppointmentRequest"]["purpose"],
                  starts_at: new Date(field(form, "starts_at")).toISOString(),
                  ends_at: new Date(field(form, "ends_at")).toISOString(),
                  timezone: field(form, "timezone"),
                  location_name: field(form, "location_name"),
                  address: field(form, "address"),
                  instructions: field(form, "instructions"),
                },
                {
                  onSuccess: (data) => {
                    resetSensitive();
                    setAppointmentId(data.id ?? "");
                    setAppointment(data);
                  },
                },
              );
            }}
          >
            <Select
              id="purpose"
              label="Finalidade"
              options={[
                { value: "interview", label: "Entrevista" },
                { value: "home_visit", label: "Visita à residência" },
                { value: "meet_and_greet", label: "Conhecer o pet" },
                { value: "delivery", label: "Entrega" },
                { value: "follow_up", label: "Acompanhamento" },
              ]}
            />
            <AppointmentFields />
            <ErrorMessage error={create.error} />
            <Button type="submit" loading={create.isPending}>
              Agendar
            </Button>
          </form>
        </details>
      )}
      {appointment && (
        <div role="status" className="flex flex-col gap-2">
          <p className="font-bold break-all">Agendamento: {appointment.id}</p>
          <p>
            {dateLabel(appointment.starts_at)} até{" "}
            {dateLabel(appointment.ends_at)}
          </p>
          <p>
            {appointment.location_name} · {appointment.address}
          </p>
          <p>Situação: {appointment.status}</p>
        </div>
      )}
      <Input
        id="appointment-id"
        label="ID do agendamento"
        value={appointmentId}
        onChange={(e) => {
          setAppointmentId(e.target.value.trim());
          resetSensitive();
        }}
        placeholder="UUID informado pela ONG"
        pattern="[0-9a-fA-F-]{36}"
      />
      {appointmentId && (
        <>
          {organization && (
            <details>
              <summary className="cursor-pointer font-bold">
                Alterar ou cancelar agendamento
              </summary>
              <form
                className="mt-3 flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  change.mutate(
                    field(form, "appointment-status") === "cancelled"
                      ? {
                          status: "cancelled",
                          reason: field(form, "appointment-reason"),
                        }
                      : {
                          starts_at: new Date(
                            field(form, "starts_at"),
                          ).toISOString(),
                          ends_at: new Date(
                            field(form, "ends_at"),
                          ).toISOString(),
                          timezone: field(form, "timezone"),
                          location_name: field(form, "location_name"),
                          address: field(form, "address"),
                          instructions: field(form, "instructions"),
                          status: "scheduled",
                          reason: field(form, "appointment-reason"),
                        },
                    { onSuccess: setAppointment },
                  );
                }}
              >
                <Select
                  id="appointment-status"
                  label="Situação"
                  value={updateStatus}
                  onChange={(event) => setUpdateStatus(event.target.value)}
                  options={[
                    { value: "scheduled", label: "Agendado" },
                    { value: "cancelled", label: "Cancelar" },
                  ]}
                />
                {updateStatus === "scheduled" && <AppointmentFields />}
                <Textarea
                  id="appointment-reason"
                  label="Motivo da alteração"
                  minLength={5}
                  maxLength={1000}
                  required
                />
                <ErrorMessage error={change.error} />
                <Button
                  type="submit"
                  variant="outline"
                  loading={change.isPending}
                >
                  Salvar alteração
                </Button>
              </form>
            </details>
          )}
          {organization && (
            <>
              <Button
                variant="outline"
                loading={otp.isPending}
                onClick={() => otp.mutate()}
              >
                Gerar código de recebimento
              </Button>
              <ErrorMessage error={otp.error} />
              {otp.data && (
                <p role="status">
                  Código: <strong>{otp.data.code}</strong> · válido até{" "}
                  {dateLabel(otp.data.expires_at)}
                </p>
              )}
            </>
          )}
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              confirm.mutate(
                organization
                  ? { type: "delivery" }
                  : { type: "receipt", otp_code: field(form, "otp_code") },
              );
            }}
          >
            {!organization && (
              <Input
                id="otp_code"
                label="Código de recebimento"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
              />
            )}
            <ErrorMessage error={confirm.error} />
            {confirm.isSuccess && <p role="status">Confirmação registrada.</p>}
            <Button type="submit" loading={confirm.isPending}>
              {organization
                ? "Confirmar entrega do pet"
                : "Confirmar recebimento do pet"}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

function AppointmentFields() {
  return (
    <>
      <Input
        id="starts_at"
        label="Início (horário local)"
        type="datetime-local"
        required
      />
      <Input
        id="ends_at"
        label="Fim (horário local)"
        type="datetime-local"
        required
      />
      <Input
        id="timezone"
        label="Fuso horário (IANA)"
        defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
        readOnly
        required
      />
      <Input
        id="location_name"
        label="Nome do local"
        minLength={1}
        maxLength={200}
        required
      />
      <Input
        id="address"
        label="Endereço completo"
        minLength={1}
        maxLength={500}
        required
      />
      <Textarea id="instructions" label="Orientações" maxLength={2000} />
    </>
  );
}
