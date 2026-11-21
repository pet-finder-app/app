"use client";
import { formatDate } from "@/components/backend/labels";
import { QueryStatus } from "@/components/backend/query-status";
import { Button, FormError, Select, Textarea } from "@/components/ui";
import {
  AGREEMENT_PLACEHOLDERS,
  agreementTemplatesOptions,
  invalidPlaceholders,
  workflowMutations,
  type AgreementKind,
} from "@/lib/api/workflows";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { AGREEMENT_KIND_LABELS, options, PLACEHOLDER_LABELS } from "./labels";

const kindSchema = z.enum(["adoption", "surrender"]);

type TemplateManagerProps = {
  organizationId: string;
  /** Go lists templates for `can_manage_applications` members. */
  canList: boolean;
  /** Go publishes templates for `can_manage_applications` members. */
  canCreate: boolean;
};

function TemplateForm({ organizationId }: { organizationId: string }) {
  const create = useMutation(workflowMutations.createTemplate(organizationId));
  const [kind, setKind] = useState<AgreementKind>("adoption");
  const [text, setText] = useState("");
  const invalid = invalidPlaceholders(text);
  const length = text.trim().length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending || length < 20 || invalid.length) return;
    create.mutate({ kind, body: text }, { onSuccess: () => setText("") });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">Publicar nova versão</h2>
      <p className="text-sm text-neutral-600">
        Cada publicação cria uma nova versão numerada. Versões anteriores e
        termos já criados continuam iguais.
      </p>
      <Select
        id="template-kind"
        label="Tipo de termo"
        value={kind}
        onChange={(event) => setKind(kindSchema.parse(event.target.value))}
        options={options(AGREEMENT_KIND_LABELS)}
      />
      <Textarea
        id="template-body"
        label="Texto do termo"
        required
        minLength={20}
        maxLength={50000}
        rows={12}
        value={text}
        onChange={(event) => setText(event.target.value)}
        hint="Entre 20 e 50.000 caracteres. Use os campos automáticos abaixo para preencher nomes e data."
        invalid={invalid.length > 0}
        errorId="template-error"
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">
          Campos automáticos
        </legend>
        <ul className="flex flex-col gap-2">
          {AGREEMENT_PLACEHOLDERS.map((key) => (
            <li key={key} className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setText(`${text}{{${key}}}`)}
                aria-label={`Inserir ${PLACEHOLDER_LABELS[key]}`}
              >
                {`{{${key}}}`}
              </Button>
              <span className="text-sm text-neutral-600">
                {PLACEHOLDER_LABELS[key]}
              </span>
            </li>
          ))}
        </ul>
      </fieldset>
      <FormError id="template-error">
        {invalid.length
          ? `Campos não reconhecidos: ${invalid.join(", ")}. Use apenas os campos automáticos listados.`
          : create.error?.message}
      </FormError>
      <Button
        type="submit"
        loading={create.isPending}
        disabled={length < 20 || invalid.length > 0}
      >
        Publicar versão
      </Button>
      {create.isSuccess ? (
        <p role="status">
          Versão {create.data.version} do{" "}
          {AGREEMENT_KIND_LABELS[create.data.kind]?.toLowerCase() ?? "termo"}{" "}
          publicada.
        </p>
      ) : null}
    </form>
  );
}

function TemplateList({ organizationId }: { organizationId: string }) {
  const query = useQuery(agreementTemplatesOptions(organizationId));
  const items = query.data?.items ?? [];
  return (
    <section aria-labelledby="templates-title" className="flex flex-col gap-3">
      <h2 id="templates-title" className="text-lg font-bold">
        Versões publicadas
      </h2>
      <QueryStatus query={query} />
      {query.data && !items.length ? (
        <p>Nenhum modelo publicado ainda.</p>
      ) : null}
      {kindSchema.options.map((kind) => {
        const versions = items.filter((item) => item.kind === kind);
        return versions.length ? (
          <div key={kind} className="flex flex-col gap-2">
            <h3 className="font-bold">{AGREEMENT_KIND_LABELS[kind]}</h3>
            <ul className="flex flex-col gap-2">
              {versions.map((template) => (
                <li key={template.id}>
                  <details className="rounded-2xl border border-border-light p-3 text-sm">
                    <summary className="cursor-pointer font-semibold">
                      Versão {template.version} ·{" "}
                      {formatDate(template.createdAt)}
                    </summary>
                    <pre className="mt-2 font-sans break-words whitespace-pre-wrap">
                      {template.body}
                    </pre>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        ) : null;
      })}
    </section>
  );
}

/** Immutable, numbered adoption and surrender agreement templates. */
export function TemplateManager({
  organizationId,
  canList,
  canCreate,
}: TemplateManagerProps) {
  return (
    <div className="flex flex-col gap-6">
      {canCreate ? <TemplateForm organizationId={organizationId} /> : null}
      {canList ? <TemplateList organizationId={organizationId} /> : null}
    </div>
  );
}
