"use client";

import { ChevronLeft, ChevronRight, Play, Plus, X } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { cn } from "./cn";
import { pressSoft } from "./elevation";
import {
  Field,
  useFieldA11y,
  type FieldBaseProps,
  type FieldTone,
} from "./field";

/** Mídia escolhida: já salva (`file` ausente) ou recém-escolhida (`file`). */
export type MediaItem = {
  key: string;
  url: string;
  type: "image" | "video";
  name: string;
  file?: File;
};

const tileClass: Record<FieldTone, string> = {
  primary: "border border-stone-300",
  light: "border border-stone-300",
  brutal: "border border-neutral-900",
};

export type MediaInputProps = FieldBaseProps & {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  /** Padrão: 10. */
  maxFiles?: number;
  /** Valor do `accept` do input de arquivo. */
  accept: string;
};

/**
 * Escolha de várias fotos e vídeos (estilo post do Instagram), com
 * miniaturas em grade e remoção individual. Diferente do `PhotoInput`, guarda
 * o `File` de verdade (para enviar em multipart) e mostra a prévia da mídia.
 * A primeira miniatura é a capa.
 */
export function MediaInput({
  id,
  label,
  hint,
  invalid,
  errorId,
  tone = "light",
  value,
  onChange,
  maxFiles = 10,
  accept,
}: MediaInputProps) {
  const { hintId, ...a11y } = useFieldA11y({ id, hint, invalid, errorId });
  const canAddMore = value.length < maxFiles;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const added: MediaItem[] = files.map((file) => ({
      key: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      name: file.name,
      file,
    }));
    onChange([...value, ...added].slice(0, maxFiles));
  }

  function move(index: number, delta: -1 | 1) {
    const next = [...value];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  }

  function remove(item: MediaItem) {
    if (item.file) URL.revokeObjectURL(item.url);
    onChange(value.filter((other) => other.key !== item.key));
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
      <ul className="grid grid-cols-3 gap-2">
        {value.map((item, index) => (
          <li
            key={item.key}
            className={cn(
              "relative aspect-square overflow-hidden rounded-xl bg-neutral-100",
              tileClass[tone],
            )}
          >
            {item.type === "video" ? (
              <>
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={`Vídeo ${item.name}`}
                  className="size-full object-cover"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900/80 text-white"
                >
                  <Play className="size-3" fill="currentColor" />
                </span>
              </>
            ) : (
              <Image
                src={item.url}
                alt={`Foto ${item.name}`}
                fill
                unoptimized
                sizes="120px"
                className="object-cover"
              />
            )}
            {index === 0 ? (
              <span className="absolute top-1 left-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-900">
                Capa
              </span>
            ) : null}
            {value.length > 1 ? (
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                {[-1, 1].map((delta) => {
                  const target = index + delta;
                  return target < 0 || target >= value.length ? (
                    <span key={delta} />
                  ) : (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => move(index, delta as -1 | 1)}
                      aria-label={`Mover ${item.name} para ${delta < 0 ? "antes" : "depois"} (posição ${target + 1})`}
                      className="flex size-7 items-center justify-center rounded-full bg-white text-neutral-900 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {delta < 0 ? (
                        <ChevronLeft className="size-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => remove(item)}
              aria-label={`Remover ${item.type === "video" ? "vídeo" : "foto"} ${item.name}`}
              className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-neutral-900 text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}

        {canAddMore ? (
          <li>
            <label
              htmlFor={id}
              aria-invalid={invalid || undefined}
              className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-neutral-50 text-center text-xs font-semibold text-neutral-900 hover:bg-primary-faint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary aria-[invalid=true]:border-red-500",
                tone === "brutal" ? "border-neutral-900" : "border-stone-300",
                pressSoft.sm,
              )}
            >
              <Plus className="size-5" aria-hidden="true" />
              {value.length > 0 ? "Adicionar" : "Fotos ou vídeos"}
              <input
                id={id}
                name={id}
                type="file"
                accept={accept}
                multiple
                className="sr-only"
                onChange={handleChange}
                {...a11y}
              />
            </label>
          </li>
        ) : null}
      </ul>
    </Field>
  );
}
