"use client";
import { mediaHref } from "@/components/backend/labels";
import { cn, Field, FormError, pressSoft, useFieldA11y } from "@/components/ui";
import {
  DOCUMENT_TYPES,
  IMAGE_TYPES,
  uploadMedia,
  type MediaPurpose,
} from "@/lib/api/mutations";
import { FileText, Plus, X } from "lucide-react";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";

export type MediaUploadFieldProps = {
  id: string;
  label: string;
  purpose: MediaPurpose;
  /** Stored Go media URLs. */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Allow several files; otherwise a new upload replaces the current one. */
  multiple?: boolean;
  /** Accepted MIME types; defaults to the types Go accepts for the purpose. */
  accept?: string;
  hint?: string;
  /** Maximum number of files when `multiple` is set. */
  maxFiles?: number;
  /** Notified while files are uploading, so forms can hold their save. */
  onBusyChange?: (isBusy: boolean) => void;
};

const isDocumentPurpose = (purpose: MediaPurpose) =>
  purpose === "document" || purpose === "surrender";

/**
 * Uploads files through the Go media API as soon as they are chosen and keeps
 * only the resulting URLs. Images show previews; documents show links.
 */
export function MediaUploadField({
  id,
  label,
  purpose,
  value,
  onChange,
  multiple = false,
  accept,
  hint,
  maxFiles = 10,
  onBusyChange,
}: MediaUploadFieldProps) {
  const errorId = `${id}-error`;
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { hintId, ...a11y } = useFieldA11y({
    id,
    hint,
    invalid: Boolean(error),
    errorId,
  });
  const isDocument = isDocumentPurpose(purpose);
  const limit = multiple ? maxFiles : 1;
  const canAdd = !multiple || value.length < limit;
  const acceptedTypes =
    accept ?? (isDocument ? DOCUMENT_TYPES : IMAGE_TYPES).join(",");

  function setBusy(isBusy: boolean) {
    setIsUploading(isBusy);
    onBusyChange?.(isBusy);
  }

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0 || isUploading) return;
    setError(null);
    const room = multiple ? limit - value.length : 1;
    if (files.length > room) {
      setError(`Envie no máximo ${limit} arquivo${limit > 1 ? "s" : ""}.`);
      return;
    }
    setBusy(true);
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const result = await uploadMedia(file, purpose);
        uploaded.push(result.url);
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
    if (uploaded.length)
      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(-1));
  }

  function remove(url: string) {
    onChange(value.filter((item) => item !== url));
  }

  return (
    <Field id={id} label={label} hint={hint} hintId={hintId} labelAsSpan>
      {value.length ? (
        <ul
          className={cn(
            isDocument ? "flex flex-col gap-2" : "grid grid-cols-3 gap-2",
          )}
        >
          {value.map((url, index) => (
            <li
              key={url}
              className={cn(
                "relative overflow-hidden border border-stone-300 bg-neutral-50",
                isDocument
                  ? "flex items-center gap-2 rounded-2xl py-2 pr-11 pl-3 text-sm"
                  : "aspect-square rounded-xl",
              )}
            >
              {isDocument ? (
                <>
                  <FileText className="size-4 shrink-0" aria-hidden="true" />
                  <a
                    href={mediaHref(url)}
                    className="truncate underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Documento {index + 1}
                  </a>
                </>
              ) : (
                <Image
                  src={mediaHref(url)}
                  alt={`${label}: imagem ${index + 1}`}
                  fill
                  unoptimized
                  sizes="120px"
                  className="object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                disabled={isUploading}
                aria-label={`Remover ${isDocument ? "documento" : "imagem"} ${index + 1} de ${label}`}
                className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-neutral-900 text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {canAdd ? (
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
            : value.length && !multiple
              ? "Substituir arquivo"
              : multiple && value.length
                ? "Adicionar mais"
                : isDocument
                  ? "Escolher documento"
                  : "Escolher imagem"}
          <input
            id={id}
            name={id}
            type="file"
            accept={acceptedTypes}
            multiple={multiple}
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
