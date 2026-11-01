"use client";

import {
  Button,
  Card,
  Checkbox,
  LinkButton,
  Select,
  Textarea,
} from "@/components/ui";
import { api, result, type Schema } from "@/lib/api/client";
import {
  keys,
  useApiMutation,
  useApplication,
  useApplications,
  useConversations,
  useOrganizationId,
} from "@/lib/api/queries";
import { useState } from "react";
import { Appointments } from "./appointments";
import {
  AppFrame,
  dateLabel,
  ErrorMessage,
  field,
  Pagination,
  QueryState,
  statusLabel,
} from "./common";
import { ReportForm } from "./reports";

export function ApplicationListScreen({
  organization = false,
  animalId,
}: {
  organization?: boolean;
  animalId?: string;
}) {
  const [orgId] = useOrganizationId();
  return (
    <AppFrame title="Adoções" organization={organization}>
      {organization && !orgId ? (
        <Card>
          <p>Selecione sua organização para consultar as candidaturas.</p>
        </Card>
      ) : (
        <ApplicationList
          key={orgId}
          organizationId={organization ? orgId : undefined}
          animalId={animalId}
        />
      )}
    </AppFrame>
  );
}

function ApplicationList({
  organizationId,
  animalId,
}: {
  organizationId?: string;
  animalId?: string;
}) {
  const [page, setPage] = useState(1);
  const query = useApplications(page, organizationId);
  return (
    <>
      <QueryState query={query} />
      {query.isSuccess && (
        <>
          {!query.data.items?.length && (
            <Card>
              <p>Nenhuma candidatura nesta página.</p>
            </Card>
          )}
          {query.data.items
            ?.filter(
              (application) => !animalId || application.animal_id === animalId,
            )
            .map((application) => (
              <Card key={application.id}>
                <h2 className="font-bold">{application.animal_name}</h2>
                <p>{statusLabel(application.status)}</p>
                <p className="text-sm">{application.applicant_message}</p>
                <LinkButton
                  href={`/${organizationId ? "ngo" : "adopter"}/adoptions/${application.id}`}
                  variant="outline"
                >
                  Ver candidatura
                </LinkButton>
              </Card>
            ))}
          <Pagination
            page={page}
            count={query.data.items?.length ?? 0}
            onPage={setPage}
          />
        </>
      )}
    </>
  );
}

export function ApplicationDetailScreen({
  id,
  organization = false,
}: {
  id: string;
  organization?: boolean;
}) {
  const query = useApplication(id);
  const data = query.data;
  return (
    <AppFrame title="Processo de adoção" organization={organization}>
      <QueryState query={query} />
      {data && (
        <>
          <Card>
            <h2 className="text-lg font-bold">
              {data.application.animal_name}
            </h2>
            <p>{statusLabel(data.application.status)}</p>
            <p>Adotante: {data.application.adopter_name}</p>
            <p>Organização: {data.application.organization_name}</p>
            <p className="whitespace-pre-wrap">
              {data.application.applicant_message}
            </p>
            {data.application.decision_reason && (
              <p>Decisão: {data.application.decision_reason}</p>
            )}
            <ApplicationConversation
              applicationId={id}
              organizationId={
                organization
                  ? (data.application.organization_id ?? undefined)
                  : undefined
              }
            />
            {data.screening && (
              <>
                <h3 className="font-bold">Triagem: {data.screening.status}</h3>
                <ScreeningAnswers encoded={data.screening.answers} />
              </>
            )}
          </Card>
          {!organization &&
            ["submitted", "screening", "more_information_requested"].includes(
              data.application.status,
            ) && <ScreeningForm applicationId={id} />}
          {organization &&
            !["completed", "cancelled", "rejected", "withdrawn"].includes(
              data.application.status,
            ) && <DecisionForm applicationId={id} />}
          {["approved", "completed"].includes(data.application.status) && (
            <Appointments
              key={id}
              applicationId={id}
              organization={organization}
            />
          )}
          <Card>
            <h2 className="font-bold">Histórico</h2>
            {data.history?.length ? (
              data.history.map((event) => (
                <p key={event.id} className="text-sm">
                  {dateLabel(event.created_at)} · {statusLabel(event.to_status)}
                  {event.reason ? ` — ${event.reason}` : ""}
                </p>
              ))
            ) : (
              <p>Sem eventos registrados.</p>
            )}
          </Card>
          <ReportForm subjectType="application" subjectId={id} />
        </>
      )}
    </AppFrame>
  );
}

function ApplicationConversation({
  applicationId,
  organizationId,
}: {
  applicationId: string;
  organizationId?: string;
}) {
  const [page, setPage] = useState(1);
  const query = useConversations(page, organizationId);
  const conversation = query.data?.items?.find(
    (item) => item.application_id === applicationId,
  );
  return (
    <>
      <QueryState query={query} />
      {conversation ? (
        <LinkButton
          href={`/${organizationId ? "ngo" : "adopter"}/conversations/${conversation.id}`}
        >
          Conversar com {organizationId ? "adopter" : "a ONG"}
        </LinkButton>
      ) : query.isSuccess ? (
        <>
          <p className="text-sm">Conversa não encontrada nesta página.</p>
          <Pagination
            page={page}
            count={query.data.items?.length ?? 0}
            onPage={setPage}
          />
        </>
      ) : null}
    </>
  );
}

function ScreeningAnswers({ encoded }: { encoded: string }) {
  let answers: unknown;
  try {
    answers = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
      ),
    );
  } catch {
    return <p>Respostas de triagem indisponíveis.</p>;
  }
  if (!answers || typeof answers !== "object" || Array.isArray(answers))
    return <p>Respostas de triagem indisponíveis.</p>;
  const labels: Record<string, string> = {
    housing: "Moradia",
    household: "Moradores",
    experience: "Experiência",
    care_plan: "Plano de cuidados",
    has_other_animals: "Outros animais",
    accepts_follow_up: "Aceita acompanhamento",
  };
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {Object.entries(answers).map(([key, value]) => (
        <div key={key}>
          <dt className="font-bold">{labels[key] ?? key}</dt>
          <dd className="whitespace-pre-wrap">
            {typeof value === "boolean"
              ? value
                ? "Sim"
                : "Não"
              : String(value ?? "")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ScreeningForm({ applicationId }: { applicationId: string }) {
  const mutation = useApiMutation(
    (body: Schema["ScreeningRequest"]) =>
      result(
        api.PUT("/v1/applications/{applicationId}/screening", {
          params: { path: { applicationId } },
          body,
        }),
      ),
    [keys.applications],
  );
  return (
    <Card>
      <h2 className="font-bold">Ficha de adoção</h2>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          mutation.mutate({
            housing: field(form, "housing"),
            household: field(form, "household"),
            experience: field(form, "experience"),
            care_plan: field(form, "care_plan"),
            has_other_animals: form.get("has_other_animals") === "on",
            accepts_follow_up: form.get("accepts_follow_up") === "on",
          });
        }}
      >
        <Textarea
          id="housing"
          label="Como é a sua moradia?"
          minLength={1}
          maxLength={1000}
          required
        />
        <Textarea
          id="household"
          label="Quem mora com você?"
          minLength={1}
          maxLength={1000}
          required
        />
        <Textarea
          id="experience"
          label="Sua experiência com animais"
          minLength={1}
          maxLength={2000}
          required
        />
        <Textarea
          id="care_plan"
          label="Como será a rotina e os cuidados com o pet?"
          minLength={20}
          maxLength={3000}
          required
        />
        <Checkbox id="has_other_animals" label="Tenho outros animais" />
        <Checkbox
          id="accepts_follow_up"
          label="Aceito acompanhamento após a adoção"
        />
        <ErrorMessage error={mutation.error} />
        {mutation.isSuccess && <p role="status">Ficha enviada.</p>}
        <Button type="submit" loading={mutation.isPending}>
          Enviar ficha
        </Button>
      </form>
    </Card>
  );
}

function DecisionForm({ applicationId }: { applicationId: string }) {
  const mutation = useApiMutation(
    (body: Schema["ApplicationDecisionRequest"]) =>
      result(
        api.POST("/v1/applications/{applicationId}/decision", {
          params: { path: { applicationId } },
          body,
        }),
      ),
    [keys.applications, keys.animals],
  );
  return (
    <Card>
      <h2 className="font-bold">Analisar candidatura</h2>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          mutation.mutate({
            decision: field(
              form,
              "decision",
            ) as Schema["ApplicationDecisionRequest"]["decision"],
            reason: field(form, "decision-reason"),
          });
        }}
      >
        <Select
          id="decision"
          label="Decisão"
          options={[
            { value: "needs_information", label: "Pedir mais informações" },
            { value: "approved", label: "Aprovar" },
            { value: "rejected", label: "Recusar" },
          ]}
        />
        <Textarea
          id="decision-reason"
          label="Motivo / orientação"
          minLength={5}
          maxLength={2000}
          required
        />
        <ErrorMessage error={mutation.error} />
        {mutation.isSuccess && <p role="status">Decisão registrada.</p>}
        <Button type="submit" loading={mutation.isPending}>
          Salvar decisão
        </Button>
      </form>
    </Card>
  );
}
