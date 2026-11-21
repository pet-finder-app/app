"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, FormError, Select, TextLink } from "@/components/ui";
import { membersOptions } from "@/lib/api/queries";
import {
  agreementTemplatesOptions,
  workflowMutations,
  type AgreementKind,
} from "@/lib/api/workflows";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useId, useState, type FormEvent } from "react";
import { AGREEMENT_KIND_LABELS } from "./labels";

type AgreementSetupProps = {
  subject: "application" | "surrender";
  subjectId: string;
  organizationId: string;
  kind: AgreementKind;
  /** The adopter or requester, who cannot also represent the organization. */
  counterpartId: string | null;
};

/** Organization managers populate the immutable agreement from a template. */
export function AgreementSetup({
  subject,
  subjectId,
  organizationId,
  kind,
  counterpartId,
}: AgreementSetupProps) {
  const id = useId();
  const templates = useQuery(agreementTemplatesOptions(organizationId));
  const members = useQuery(membersOptions(organizationId));
  const create = useMutation(workflowMutations.createAgreement());
  const [templateId, setTemplateId] = useState("");
  const [representativeId, setRepresentativeId] = useState("");
  const available = (templates.data?.items ?? []).filter(
    (template) => template.kind === kind,
  );
  const representatives = (members.data?.items ?? []).filter(
    (member) =>
      member.status === "active" &&
      member.canManageApplications &&
      member.userId !== null &&
      member.userId !== counterpartId,
  );
  const selected = available.find((template) => template.id === templateId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending || !templateId || !representativeId) return;
    create.mutate({ subject, id: subjectId, templateId, representativeId });
  }

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-3">
      <h2 id={`${id}-title`} className="text-lg font-bold">
        Preparar o {AGREEMENT_KIND_LABELS[kind]?.toLowerCase() ?? "termo"}
      </h2>
      <p className="text-sm text-neutral-600">
        O texto é preenchido com os nomes e a data de hoje e não pode ser
        alterado depois. As duas partes assinam com um código enviado por
        e-mail.
      </p>
      <QueryStatus query={templates} />
      <QueryStatus query={members} />
      {templates.data && !available.length ? (
        <p role="note">
          Nenhum modelo deste tipo foi publicado.{" "}
          <TextLink href="/ngo/settings/agreement">
            Publique um modelo de termo
          </TextLink>{" "}
          para continuar.
        </p>
      ) : null}
      {available.length ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Select
            id={`${id}-template`}
            label="Modelo"
            required
            placeholder="Escolha um modelo"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            options={available.map((template) => ({
              value: template.id,
              label: `Versão ${template.version} · ${formatDate(template.createdAt)}`,
            }))}
          />
          {selected ? (
            <details className="rounded-2xl border border-border-light p-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                Ver texto do modelo
              </summary>
              <pre className="mt-2 font-sans break-words whitespace-pre-wrap">
                {selected.body}
              </pre>
            </details>
          ) : null}
          <Select
            id={`${id}-representative`}
            label="Representante da ONG que assina"
            required
            placeholder="Escolha um membro"
            value={representativeId}
            onChange={(event) => setRepresentativeId(event.target.value)}
            options={representatives.map((member) => ({
              value: member.userId ?? "",
              label: member.displayName,
            }))}
            hint="Somente membros ativos que gerenciam pedidos podem representar a ONG."
          />
          <FormError id={`${id}-error`}>{create.error?.message}</FormError>
          <Button
            type="submit"
            loading={create.isPending}
            disabled={!templateId || !representativeId}
          >
            Criar termo
          </Button>
        </form>
      ) : null}
    </section>
  );
}
