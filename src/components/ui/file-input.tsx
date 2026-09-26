"use client";

import type { UploadedFile } from "@/lib/ong";
import type { ChangeEvent } from "react";
import { pressBrutal, shadowBrutal } from "./brutal";
import { Button } from "./button";
import { cn } from "./cn";
import { Field, useFieldA11y, type FieldBaseProps } from "./field";

export type FileInputProps = FieldBaseProps & {
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  accept?: string;
};

function formatSize(bytes: number): string {
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
            "flex items-center justify-between gap-3 rounded-lg border-2 border-line bg-white px-4 py-3 text-sm",
            shadowBrutal.sm,
          )}
        >
          <span className="min-w-0 truncate text-neutral-900">
            {value.name}{" "}
            <span className="text-neutral-500">({formatSize(value.size)})</span>
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
            "flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-line bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-primary-faint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary aria-[invalid=true]:border-red-500",
            shadowBrutal.sm,
            pressBrutal.sm,
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
