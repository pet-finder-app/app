"use client";
import {
  Button,
  Checkbox,
  FormError,
  LinkButton,
  Textarea,
} from "@/components/ui";
import { apiMutations, type ScreeningInput } from "@/lib/api/mutations";
import { applicationOptions } from "@/lib/api/queries";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AppointmentPanel } from "./appointment-panel";
import { APPLICATION_STATUS_LABELS, formatDate } from "./labels";
import { QueryStatus } from "./query-status";

const answersSchema = z.object({
  housing: z.string(),
  household: z.string(),
  experience: z.string(),
  care_plan: z.string(),
  has_other_animals: z.boolean().optional(),
  accepts_follow_up: z.boolean().optional(),
});
function decodeAnswers(value: string) {
  try {
    const payload: unknown = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(value), (character) => character.charCodeAt(0)),
      ),
    );
    const result = answersSchema.safeParse(payload);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
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
export function ApplicationDetail({
  id,
  userId,
}: {
  id: string;
  userId: string;
}) {
  const query = useQuery(applicationOptions(id));
  const decision = useMutation(apiMutations.applicationDecision());
  const [reason, setReason] = useState("");
  const data = query.data;
  const isApplicant = data?.application.adopterId === userId;
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
          {data.application.status === "approved" ? (
            <AppointmentPanel applicationId={id} isApplicant={isApplicant} />
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
