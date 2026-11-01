"use client";

import { Button, cn, shadowSoft } from "@/components/ui";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { CrossedLocationIcon } from "./crossed-location-icon";
import styles from "./location-disabled-dialog.module.css";
import { LOCATION_DISABLED_MESSAGE } from "./use-browser-location";

type LocationDisabledDialogProps = {
  isOpen: boolean;
  message: string | null;
  onDismiss: () => void;
};

export function LocationDisabledDialog({
  isOpen,
  message,
  onDismiss,
}: LocationDisabledDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const description = (message ?? LOCATION_DISABLED_MESSAGE).replace(
    /^Localização desativada\.\s*/,
    "",
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onClose={onDismiss}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onDismiss();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border-0 bg-white p-6 text-center text-text",
        styles.dialog,
        shadowSoft.lg,
      )}
    >
      <button
        type="button"
        aria-label="Fechar aviso de localização"
        onClick={onDismiss}
        className="absolute top-2 right-2 flex size-10 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-2 focus-visible:outline-text"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      {isOpen ? (
        <CrossedLocationIcon animated className="mx-auto mt-4 mb-5 size-24" />
      ) : null}
      <h2 id={`${id}-title`} className="text-xl font-bold">
        Localização desativada
      </h2>
      <p
        id={`${id}-description`}
        className="mt-3 mb-6 text-sm leading-relaxed text-neutral-600"
      >
        {description}
      </p>
      <Button className="w-full" onClick={onDismiss}>
        Entendi
      </Button>
    </dialog>
  );
}
