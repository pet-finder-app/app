"use client";

import { cn, shadowSoft } from "@/components/ui";
import type { Pet } from "@/lib/pet";
import type { Post } from "@/lib/post";
import { MoreVertical, PawPrint, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Menu de "..." no cabeçalho do post: editar post, editar o pet marcado ou excluir. */
export function PostCardMenu({
  post,
  pet,
  redirectTo,
}: {
  post: Post;
  pet: Pet | null;
  /** Para onde ir depois de excluir (a página do post volta ao perfil). */
  redirectTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function closeMenu() {
    setOpen(false);
    setConfirmingDelete(false);
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    await fetch(`/api/ong/posts/${post.id}`, { method: "DELETE" });
    closeMenu();
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  const itemClass =
    "flex items-center gap-2 px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-50";

  return (
    <div ref={rootRef} className="relative flex size-9 shrink-0">
      <button
        type="button"
        aria-label="Mais opções do post"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100"
      >
        <MoreVertical className="size-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-9 right-0 z-10 flex w-48 flex-col overflow-hidden rounded-xl border border-neutral-900 bg-white py-1",
            shadowSoft.md,
          )}
        >
          <Link
            href={`/ong/posts/${post.id}/editar`}
            role="menuitem"
            className={itemClass}
            onClick={closeMenu}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Editar post
          </Link>
          {pet ? (
            <Link
              href={`/ong/pets/${pet.id}/editar`}
              role="menuitem"
              className={itemClass}
              onClick={closeMenu}
            >
              <PawPrint className="size-4" aria-hidden="true" />
              Editar {pet.name}
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            disabled={deleting}
            onClick={handleDelete}
            className={cn(
              "flex items-center gap-2 border-t border-stone-300 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-60",
              confirmingDelete && "font-bold",
            )}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {deleting
              ? "Excluindo…"
              : confirmingDelete
                ? "Confirmar exclusão?"
                : "Excluir post"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
