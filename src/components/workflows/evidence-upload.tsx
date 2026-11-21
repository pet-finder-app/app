"use client";
import { mediaHref } from "@/components/backend/labels";
import { cn, Field, FormError, pressSoft, useFieldA11y } from "@/components/ui";
import {
  DOCUMENT_TYPES,
  IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  uploadMedia,
} from "@/lib/api/mutations";
import { FileText, Plus, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";

/** A private file already stored by Go; workflows send only its id. */
export type UploadedEvidence = { id: string; url: string; name: string };

type EvidenceUploadProps = {
  id: string;
  label: string;
  /** Follow-ups accept images; surrenders also accept PDF. */
  purpose: "followup" | "surrender";
  value: UploadedEvidence[];
  onChange: (items: UploadedEvidence[]) => void;
  maxFiles?: number;
  onBusyChange?: (isBusy: boolean) => void;
};

/** Uploads private evidence through the Go media API as soon as it is chosen. */
export function EvidenceUpload({
  id,
  label,
  purpose,
  value,
  onChange,
  maxFiles = 20,
  onBusyChange,
}: EvidenceUploadProps) {
  const errorId = `${id}-error`;
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const types = purpose === "surrender" ? DOCUMENT_TYPES : IMAGE_TYPES;
  const hint = `${purpose === "surrender" ? "PDF, JPEG, PNG ou WebP" : "JPEG, PNG ou WebP"}, até ${MAX_UPLOAD_BYTES / 1024 / 1024} MB cada, no máximo ${maxFiles} arquivos. Somente as pessoas envolvidas no processo podem ver.`;
  const { hintId, ...a11y } = useFieldA11y({
    id,
    hint,
    invalid: Boolean(error),
    errorId,
  });

  function setBusy(isBusy: boolean) {
    setIsUploading(isBusy);
    onBusyChange?.(isBusy);
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || isUploading) return;
    setError(null);
    if (value.length + files.length > maxFiles) {
      setError(`Envie no máximo ${maxFiles} arquivos.`);
      return;
    }
    setBusy(true);
    const uploaded: UploadedEvidence[] = [];
    try {
      for (const file of files) {
        const result = await uploadMedia(file, purpose);
        uploaded.push({ id: result.id, url: result.url, name: file.name });
      }
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível enviar o arquivo.",
      );
    } finally {
      setBusy(false);
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
  }

  return (
    <Field id={id} label={label} hint={hint} hintId={hintId} labelAsSpan>
      {value.length ? (
        <ul className="flex flex-col gap-2">
          {value.map((item, index) => (
            <li
              key={item.id}
              className="relative flex min-h-11 items-center gap-2 rounded-2xl border border-stone-300 bg-neutral-50 py-2 pr-12 pl-3 text-sm"
            >
              <FileText className="size-4 shrink-0" aria-hidden="true" />
              <a
                href={mediaHref(item.url)}
                className="min-w-0 truncate underline"
                target="_blank"
                rel="noreferrer"
              >
                {item.name || `Arquivo ${index + 1}`}
              </a>
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((other) => other.id !== item.id))
                }
                disabled={isUploading}
                aria-label={`Remover ${item.name || `arquivo ${index + 1}`}`}
                className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900 text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {value.length < maxFiles ? (
        <label
          htmlFor={id}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-primary-faint has-[:disabled]:cursor-wait has-[:disabled]:opacity-60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary aria-[invalid=true]:border-red-500",
            pressSoft.sm,
          )}
        >
          <Plus className="size-4" aria-hidden="true" />
          {isUploading
            ? "Enviando..."
            : value.length
              ? "Adicionar mais arquivos"
              : "Escolher arquivos"}
          <input
            id={id}
            name={id}
            type="file"
            accept={types.join(",")}
            multiple
            disabled={isUploading}
            className="sr-only"
            onChange={(event) => void handleChange(event)}
            {...a11y}
          />
        </label>
      ) : null}
      <FormError id={errorId}>{error}</FormError>
    </Field>
  );
}
