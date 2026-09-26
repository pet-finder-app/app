"use client";

import { cn, shadowSoft } from "@/components/ui";
import type { Pet } from "@/lib/pet";
import { Archive, MoreVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Menu de "..." no canto do card do pet: editar ou arquivar. */
export function PetCardMenu({ pet }: { pet: Pet }) {
  const [open, setOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleArchive() {
    setArchiving(true);
    await fetch(`/api/ong/pets/${pet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    router.refresh();
  }

  return (
    <div ref={rootRef} className="relative flex size-9 shrink-0">
      <button
        type="button"
        aria-label={`Mais opções de ${pet.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-full text-neutral-700 hover:bg-white/50"
      >
        <MoreVertical className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-9 right-0 z-10 flex w-40 flex-col overflow-hidden rounded-xl border border-neutral-900 bg-white py-1",
            shadowSoft.md,
          )}
        >
          <Link
            href={`/ong/pets/${pet.id}/editar`}
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            onClick={() => setOpen(false)}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Editar
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={archiving}
            onClick={handleArchive}
            className="flex items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            <Archive className="size-4" aria-hidden="true" />
            {archiving ? "Arquivando…" : "Arquivar pet"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
