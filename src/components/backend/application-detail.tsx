"use client";
import {
  Button,
  Checkbox,
  FormError,
  LinkButton,
  Textarea,
} from "@/components/ui";
import {
  canManageOrganization,
  type ViewerAccess,
} from "@/components/workflows/access";
import { FollowupPanel } from "@/components/workflows/followup-panel";
import { ReasonSheet } from "@/components/workflows/reason-sheet";
import { apiMutations, type ScreeningInput } from "@/lib/api/mutations";
import { applicationOptions } from "@/lib/api/queries";
import { workflowMutations } from "@/lib/api/workflows";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AppointmentPanel } from "./appointment-panel";
import { APPLICATION_STATUS_LABELS, formatDate } from "./labels";
import { QueryStatus } from "./query-status";
import { VerifiedBadge } from "./verified-badge";

const answersSchema = z.object({
  housing: z.string(),
  household: z.string(),
  experience: z.string(),
  care_plan: z.string(),
  has_other_animals: z.boolean().optional(),
  accepts_follow_up: z.boolean().optional(),
});
/** Go returns screening answers as a JSON object (JSONB), validated here. */
function decodeAnswers(value: unknown) {
  const result = answersSchema.safeParse(value);
  return result.success ? result.data : null;
}
function ScreeningForm({ id }: { id: string }) {
  const mutation = useMutation(apiMutations.screening());
  const [draft, setDraft] = useState<ScreeningInput>({
    housing: "",
    household: "",
    experience: "",
    carePlan: "",
    hasOtherAnimals: false,
    acceptsFollowUp: false,
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mutation.isPending) mutation.mutate({ id, answers: draft });
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Triagem para adoção</h2>
      <Textarea
        id="screening-housing"
        label="Moradia"
        required
        maxLength={1000}
        value={draft.housing}
        onChange={(event) =>
          setDraft({ ...draft, housing: event.target.value })
        }
      />
      <Textarea
        id="screening-household"
        label="Quem mora com você?"
        required
        maxLength={1000}
        value={draft.household}
        onChange={(event) =>
          setDraft({ ...draft, household: event.target.value })
        }
      />
      <Textarea
        id="screening-experience"
        label="Experiência com animais"
        required
        maxLength={2000}
        value={draft.experience}
        onChange={(event) =>
          setDraft({ ...draft, experience: event.target.value })
        }
      />
      <Textarea
        id="screening-plan"
        label="Plano de cuidados"
        required
        minLength={20}
        maxLength={3000}
        value={draft.carePlan}
        onChange={(event) =>
          setDraft({ ...draft, carePlan: event.target.value })
        }
      />
      <Checkbox
        id="screening-other-animals"
        label="Tenho outros animais"
        checked={draft.hasOtherAnimals}
        onChange={(event) =>
          setDraft({ ...draft, hasOtherAnimals: event.target.checked })
        }
      />
      <Checkbox
        id="screening-follow-up"
        label="Aceito acompanhamento"
        checked={draft.acceptsFollowUp}
        onChange={(event) =>
          setDraft({ ...draft, acceptsFollowUp: event.target.checked })
        }
      />
      <FormError id="screening-error">{mutation.error?.message}</FormError>
      <Button type="submit" loading={mutation.isPending}>
        Enviar respostas
      </Button>
      {mutation.isSuccess ? <p role="status">Respostas enviadas.</p> : null}
    </form>
  );
}
const CANCELLABLE_STATUSES = [
  "submitted",
  "screening",
  "more_information_requested",
  "approved",
];
function ApplicationCancellation({ id }: { id: string }) {
  const cancellation = useMutation(workflowMutations.cancelApplication());
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button variant="danger-ghost" onClick={() => setIsOpen(true)}>
        Cancelar pedido
      </Button>
      {isOpen ? (
        <ReasonSheet
          title="Cancelar pedido de adoção"
          description="O cancelamento encerra o pedido e a conversa com o adotante, cancela encontros pendentes e, se o pedido estava aprovado, deixa o animal disponível novamente. O motivo fica registrado no histórico e esta ação não pode ser desfeita."
          label="Motivo do cancelamento"
          confirmLabel="Cancelar pedido"
          isBusy={cancellation.isPending}
          error={cancellation.error?.message}
          onConfirm={(reason) => cancellation.mutateAsync({ id, reason })}
          onClose={() => {
            setIsOpen(false);
            cancellation.reset();
          }}
        />
      ) : null}
    </>
  );
}
type ApplicationDetailProps = {
  id: string;
  access: ViewerAccess;
};
export function ApplicationDetail({ id, access }: ApplicationDetailProps) {
  const userId = access.userId;
  const query = useQuery(applicationOptions(id));
  const decision = useMutation(apiMutations.applicationDecision());
  const withdrawal = useMutation(apiMutations.withdrawApplication());
  const [reason, setReason] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const data = query.data;
  const isApplicant = data?.application.adopterId === userId;
  const canManage =
    !isApplicant &&
    canManageOrganization(access, data?.application.organizationId);
  const answers = data?.screening
    ? decodeAnswers(data.screening.answers)
    : null;
  return (
    <>
      <QueryStatus query={query} />
      {data ? (
        <>
          <h2 className="text-xl font-bold">
            Adoção de {data.application.animalName}
          </h2>
          {isApplicant ? null : (
            <p className="flex flex-wrap items-center gap-2">
              Adotante: {data.application.adopterName}
              <VerifiedBadge
                status={data.application.adopterVerificationStatus}
              />
            </p>
          )}
          <p>
            {APPLICATION_STATUS_LABELS[data.application.status] ??
              "Situação não informada"}
          </p>
          <p>{data.application.applicantMessage}</p>
          <LinkButton
            variant="outline"
            href={`/pets/${data.application.animalId}`}
          >
            Ver animal
          </LinkButton>
          {data.conversations.map((conversation) => (
            <LinkButton
              key={conversation.id}
              variant="outline"
              href={`/${isApplicant ? "adopter" : "ngo"}/conversations/${conversation.id}`}
            >
              {conversation.status === "closed"
                ? "Ver conversa encerrada"
                : "Abrir conversa com a ONG"}
            </LinkButton>
          ))}
          {data.application.decisionReason ? (
            <p>Resposta da organização: {data.application.decisionReason}</p>
          ) : null}
          {answers ? (
            <section className="flex flex-col gap-2">
              <h2 className="font-bold">Respostas da triagem</h2>
              <p>Moradia: {answers.housing}</p>
              <p>Família: {answers.household}</p>
              <p>Experiência: {answers.experience}</p>
              <p>Cuidados: {answers.care_plan}</p>
            </section>
          ) : data.screening ? (
            <p role="alert">Não foi possível ler as respostas anteriores.</p>
          ) : null}
          {isApplicant &&
          ["submitted", "screening", "more_information_requested"].includes(
            data.application.status,
          ) ? (
            <ScreeningForm id={id} />
          ) : null}
          {!isApplicant &&
          ["submitted", "screening", "more_information_requested"].includes(
            data.application.status,
          ) ? (
            <section className="flex flex-col gap-3">
              <Textarea
                id="application-decision"
                label="Resposta para o adotante"
                required
                minLength={5}
                maxLength={2000}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "approved", label: "Aprovar" },
                  { value: "needs_information", label: "Pedir informações" },
                  { value: "rejected", label: "Recusar" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    disabled={decision.isPending || reason.trim().length < 5}
                    onClick={() =>
                      decision.mutate({
                        id,
                        decision: z
                          .enum(["approved", "rejected", "needs_information"])
                          .parse(option.value),
                        reason,
                      })
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <FormError id="application-decision-error">
                {decision.error?.message}
              </FormError>
            </section>
          ) : null}
          {isApplicant &&
          ["submitted", "screening", "more_information_requested"].includes(
            data.application.status,
          ) ? (
            <form
              className="flex flex-col gap-3 border-t border-border-light pt-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (
                  !withdrawal.isPending &&
                  withdrawalReason.trim().length >= 5
                )
                  withdrawal.mutate({ id, reason: withdrawalReason.trim() });
              }}
            >
              <h2 className="text-lg font-bold">Desistir da adoção</h2>
              <p>
                Ao desistir, seu pedido será retirado e a conversa será
                encerrada.
              </p>
              <Textarea
                id="application-withdrawal-reason"
                label="Motivo da desistência"
                required
                minLength={5}
                maxLength={2000}
                value={withdrawalReason}
                onChange={(event) => setWithdrawalReason(event.target.value)}
                errorId="application-withdrawal-error"
              />
              <FormError id="application-withdrawal-error">
                {withdrawal.error?.message}
              </FormError>
              <Button
                type="submit"
                variant="danger"
                loading={withdrawal.isPending}
                disabled={withdrawalReason.trim().length < 5}
              >
                Confirmar desistência
              </Button>
            </form>
          ) : null}
          {["approved", "completed"].includes(data.application.status) ? (
            <section className="flex flex-col gap-2 border-t border-border-light pt-4">
              <h2 className="text-lg font-bold">Termo de adoção</h2>
              <p className="text-sm text-neutral-600">
                O adotante e o representante da ONG assinam o termo com um
                código enviado por e-mail.
              </p>
              <LinkButton
                variant="outline"
                href={`/adoptions/${encodeURIComponent(id)}/agreement`}
              >
                {canManage
                  ? "Preparar ou ver o termo"
                  : "Ver e assinar o termo"}
              </LinkButton>
            </section>
          ) : null}
          {data.application.status === "completed" ? (
            <FollowupPanel
              applicationId={id}
              canSchedule={canManage}
              isApplicant={isApplicant}
            />
          ) : null}
          {isApplicant && data.application.status === "completed" ? (
            <LinkButton
              variant="outline"
              href={`/adopter/surrenders/new?application=${encodeURIComponent(id)}`}
            >
              Devolver este animal à ONG
            </LinkButton>
          ) : null}
          {canManage &&
          CANCELLABLE_STATUSES.includes(data.application.status) ? (
            <ApplicationCancellation id={id} />
          ) : null}
          {["approved", "completed", "cancelled"].includes(
            data.application.status,
          ) ? (
            <AppointmentPanel
              applicationId={id}
              isApplicant={isApplicant}
              canSchedule={
                data.application.status === "approved" && !isApplicant
              }
            />
          ) : null}
          <section>
            <h2 className="font-bold">Histórico</h2>
            <ul>
              {data.history.map((event) => (
                <li key={event.id}>
                  {formatDate(event.createdAt)} ·{" "}
                  {APPLICATION_STATUS_LABELS[event.toStatus] ?? "Atualização"}
                  {event.reason ? ` · ${event.reason}` : ""}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </>
  );
}
