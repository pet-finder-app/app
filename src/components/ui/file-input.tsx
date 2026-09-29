"use client";

import type { UploadedFile } from "@/lib/ong";
import type { ChangeEvent } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { pressSoft, shadowSoft } from "./elevation";
import { Field, useFieldA11y, type FieldBaseProps } from "./field";

export type FileInputProps = FieldBaseProps & {
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  accept?: string;
};

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Só guarda os metadados do arquivo (nome, tamanho, tipo). O upload real
 * entra quando o backend existir — ver `UploadedFile.url`.
 */
export function FileInput({
  id,
  label,
  hint,
  invalid,
  errorId,
  tone = "light",
  value,
  onChange,
  accept,
}: FileInputProps) {
  const { hintId, ...a11y } = useFieldA11y({ id, hint, invalid, errorId });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange({
      name: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      url: null,
    });
  }

  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      hintId={hintId}
      tone={tone}
      labelAsSpan
    >
      {value ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm",
            shadowSoft.sm,
          )}
        >
          <span className="min-w-0 truncate text-neutral-900">
            {value.name}{" "}
            <span className="text-neutral-600">({formatSize(value.size)})</span>
          </span>
          <Button
            variant="danger"
            size="sm"
            className="shrink-0"
            onClick={() => onChange(null)}
            aria-label={`Remover arquivo ${value.name}`}
          >
            Remover
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900 hover:bg-primary-faint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary aria-[invalid=true]:border-red-500",
            pressSoft.sm,
          )}
        >
          Escolher arquivo
          <input
            id={id}
            name={id}
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleChange}
            {...a11y}
          />
        </label>
      )}
    </Field>
  );
}
