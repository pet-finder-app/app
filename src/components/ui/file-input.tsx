"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "./cn";
import { Field, useFieldA11y, type FieldBaseProps } from "./field";
import { iconSize } from "./icon";

export type FileInputProps = FieldBaseProps & {
  value: File | null;
  onChange: (file: File | null) => void;
  /** Comma-separated MIME types, wildcards (image/*), or extensions (.pdf). */
  accept?: string;
  /** Largest accepted file, in bytes. */
  maxSize?: number;
  disabled?: boolean;
};

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .some((token) =>
      token.startsWith(".")
        ? name.endsWith(token)
        : token.endsWith("/*")
          ? file.type.startsWith(token.slice(0, -1))
          : file.type === token,
    );
}

/** Single-file dropzone: drag a file in, or activate it to browse. */
export function FileInput({
  id,
  label,
  labelIcon,
  hint,
  invalid,
  errorId,
  tone = "light",
  value,
  onChange,
  accept,
  maxSize,
  disabled = false,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rejection, setRejection] = useState<string | null>(null);
  const rejectionId = `${id}-rejection`;
  const { hintId, ...a11y } = useFieldA11y({
    id,
    hint,
    invalid: invalid || Boolean(rejection),
    errorId: rejection ? rejectionId : errorId,
  });

  function select(file: File | undefined) {
    if (!file) return;
    if (!matchesAccept(file, accept)) {
      setRejection("Formato de arquivo não aceito.");
      return;
    }
    if (maxSize !== undefined && file.size > maxSize) {
      setRejection(`O arquivo excede ${formatSize(maxSize)}.`);
      return;
    }
    setRejection(null);
    onChange(file);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    select(event.target.files?.[0]);
    // Allow choosing the same file again after removing it.
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) return;
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // Ignore moves between the dropzone's own children.
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) select(event.dataTransfer.files[0]);
  }

  return (
    <Field
      id={id}
      label={label}
      labelIcon={labelIcon}
      hint={hint}
      hintId={hintId}
      tone={tone}
    >
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={handleChange}
        {...a11y}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border-light bg-white p-3 text-sm [input:focus-visible+&]:ring-2 [input:focus-visible+&]:ring-accent-tertiary">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
            <FileText className={iconSize.lg} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium text-neutral-900">
              {value.name}
            </span>
            <span className="text-xs text-neutral-600">
              {formatSize(value.size)}
            </span>
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setRejection(null);
              onChange(null);
              inputRef.current?.focus();
            }}
            aria-label={`Remover arquivo ${value.name}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-secondary hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-accent-tertiary disabled:opacity-60"
          >
            <X className={iconSize.lg} aria-hidden="true" />
          </button>
        </div>
      ) : (
        // Pointer and drag target; keyboard and assistive technology use the input.
        <div
          data-dragging={isDragging || undefined}
          aria-hidden="true"
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-light bg-neutral-100 px-4 py-6 text-center text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-200/70 data-[dragging=true]:border-neutral-500 data-[dragging=true]:bg-neutral-200",
            "[input:focus-visible+&]:ring-2 [input:focus-visible+&]:ring-accent-tertiary",
            (invalid || rejection) && "border-red-500",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <Upload className="size-8 text-neutral-500" strokeWidth={1.75} />
          <span>
            {isDragging ? (
              <strong className="text-neutral-900">Solte o arquivo aqui</strong>
            ) : (
              <>
                Arraste o arquivo aqui ou{" "}
                <strong className="text-accent-tertiary">
                  escolha no dispositivo
                </strong>
              </>
            )}
          </span>
        </div>
      )}
      {rejection ? (
        <p id={rejectionId} role="alert" className="text-xs text-red-700">
          {rejection}
        </p>
      ) : null}
    </Field>
  );
}
