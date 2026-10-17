"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import styles from "./bottom-sheet.module.css";

export type BottomSheetHandle = { close: () => void };

type BottomSheetProps = {
  ref?: Ref<BottomSheetHandle>;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  isBusy?: boolean;
  onClose: () => void;
};

type SheetDrag = {
  pointerId: number;
  startY: number;
  startTime: number;
  height: number;
  offset: number;
};

/** Mount to open a modal sheet; unmount after onClose to restore the trigger's focus. */
export function BottomSheet({
  ref,
  title,
  children,
  footer,
  isBusy = false,
  onClose,
}: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragRef = useRef<SheetDrag | null>(null);
  const isClosingRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const suppressHandleClickRef = useRef(false);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.dataset.state = "entering";
    dialog.showModal();
    return () => {
      if (closeTimerRef.current !== null)
        window.clearTimeout(closeTimerRef.current);
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function finishClose() {
    if (!isClosingRef.current) return;
    if (closeTimerRef.current !== null)
      window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    dialogRef.current?.close();
    isClosingRef.current = false;
  }

  function handleClose(force = false) {
    const dialog = dialogRef.current;
    if (!dialog?.open || isClosingRef.current || (isBusy && !force)) return;
    isClosingRef.current = true;
    dragRef.current = null;
    dialog.dataset.dragging = "false";
    dialog.dataset.state = "closing";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishClose();
    } else {
      // Keep the modal and scroll lock until its exit animation finishes.
      closeTimerRef.current = window.setTimeout(finishClose, 260);
    }
  }

  useImperativeHandle(ref, () => ({ close: () => handleClose(true) }));

  function handleDragStart(event: PointerEvent<HTMLButtonElement>) {
    const dialog = dialogRef.current;
    if (
      !dialog ||
      isBusy ||
      isClosingRef.current ||
      !event.isPrimary ||
      event.button !== 0
    )
      return;
    suppressHandleClickRef.current = false;
    dialog.dataset.state = "open";
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTime: event.timeStamp,
      height: dialog.getBoundingClientRect().height,
      offset: 0,
    };
    dialog.dataset.dragging = "true";
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleDragMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const dialog = dialogRef.current;
    if (!drag || !dialog || drag.pointerId !== event.pointerId) return;
    const distance = event.clientY - drag.startY;
    if (Math.abs(distance) > 3) suppressHandleClickRef.current = true;
    // Upward pulls stretch the sheet gently while its bottom stays anchored.
    drag.offset =
      distance < 0
        ? -Math.min(32, -distance * 0.2)
        : Math.min(distance, drag.height);
    dialog.style.setProperty("--sheet-offset", `${drag.offset}px`);
  }

  function handleDragCancel() {
    if (!dragRef.current) return;
    dragRef.current = null;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.dataset.dragging = "false";
    dialog.style.setProperty("--sheet-offset", "0px");
  }

  function handleDragEnd(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    handleDragMove(event);
    const distance = event.clientY - drag.startY;
    const velocity = distance / Math.max(1, event.timeStamp - drag.startTime);
    if (
      distance > Math.min(96, drag.height * 0.28) ||
      (distance > 24 && velocity > 0.65)
    ) {
      handleClose();
    } else {
      handleDragCancel();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby={`${id}-title`}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        if (isClosingRef.current) finishClose();
        else if (event.currentTarget.dataset.state === "entering")
          event.currentTarget.dataset.state = "open";
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
          handleClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
    >
      <button
        type="button"
        className={styles.dragHandle}
        aria-label="Arrastar ou fechar formulário"
        disabled={isBusy}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragCancel}
        onLostPointerCapture={handleDragCancel}
        onClick={(event) => {
          if (event.detail > 0 && suppressHandleClickRef.current) {
            suppressHandleClickRef.current = false;
            return;
          }
          handleClose();
        }}
      >
        <span aria-hidden="true" />
      </button>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Fechar formulário"
          disabled={isBusy}
          onClick={() => handleClose()}
          className="flex size-11 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-2 focus-visible:outline-accent-tertiary"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className={styles.content}>{children}</div>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
    </dialog>
  );
}
