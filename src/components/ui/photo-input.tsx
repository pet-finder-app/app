"use client";

import type { UploadedFile } from "@/lib/ong";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { Button } from "./button";
import { cn } from "./cn";
import { pressSoft, shadowSoft } from "./elevation";
import {
  Field,
  useFieldA11y,
  type FieldBaseProps,
  type FieldTone,
} from "./field";
import { formatSize } from "./file-input";

const listItemClass: Record<FieldTone, string> = {
  primary: cn("rounded-2xl border border-stone-300 bg-white", shadowSoft.sm),
  light: cn("rounded-2xl border border-stone-300 bg-white", shadowSoft.sm),
  brutal: "rounded-xl border border-neutral-900 bg-white",
};

const dropzoneClass: Record<FieldTone, string> = {
  primary:
    "rounded-2xl border border-dashed border-stone-300 bg-neutral-50 hover:bg-primary-faint",
  light:
    "rounded-2xl border border-dashed border-stone-300 bg-neutral-50 hover:bg-primary-faint",
  brutal:
    "rounded-xl border border-dashed border-neutral-900 bg-white hover:bg-neutral-50",
};

/** Maior lado da foto guardada: o suficiente para cartões e posts, sem pesar. */
const MAX_SIDE = 1200;

/**
 * Lê a imagem, reduz para `MAX_SIDE` e devolve um data URL em JPEG. Enquanto
 * não há backend de upload, é isso que permite a foto aparecer depois de
 * salva. Se algo falhar, devolve `null` (o arquivo fica só com os metadados).
 */
async function toDataUrl(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

export type PhotoInputProps = FieldBaseProps & {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  /** Padrão: 6. */
  maxFiles?: number;
};

/**
 * Variação do `FileInput` para várias fotos (pets, perfil público da ONG).
 * Só guarda os metadados de cada arquivo — o upload real entra com o
 * backend, ver `UploadedFile.url`.
 */
export function PhotoInput({
  id,
  label,
  hint,
  invalid,
  errorId,
  tone = "light",
  value,
  onChange,
  maxFiles = 6,
}: PhotoInputProps) {
  const { hintId, ...a11y } = useFieldA11y({ id, hint, invalid, errorId });
  const canAddMore = value.length < maxFiles;

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) return;
    const added: UploadedFile[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        url: await toDataUrl(file),
      })),
    );
    onChange([...value, ...added].slice(0, maxFiles));
    input.value = "";
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
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
      {value.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {value.map((photo, index) => (
            <li
              key={`${photo.name}-${index}`}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 text-sm",
                listItemClass[tone],
              )}
            >
              {photo.url ? (
                <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                </span>
              ) : null}
              <span className="min-w-0 flex-1 truncate text-neutral-900">
                {photo.name}{" "}
                <span className="text-neutral-600">
                  ({formatSize(photo.size)})
                </span>
              </span>
              <Button
                variant="danger"
                size="sm"
                className="shrink-0"
                onClick={() => remove(index)}
                aria-label={`Remover foto ${photo.name}`}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {canAddMore ? (
        <label
          htmlFor={id}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex cursor-pointer items-center justify-center px-4 py-3 text-sm font-semibold text-neutral-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary aria-[invalid=true]:border-red-500",
            dropzoneClass[tone],
            pressSoft.sm,
          )}
        >
          {value.length > 0 ? "Adicionar mais fotos" : "Escolher fotos"}
          <input
            id={id}
            name={id}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleChange}
            {...a11y}
          />
        </label>
      ) : null}
    </Field>
  );
}
