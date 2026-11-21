"use client";

import { Button, FormError } from "@/components/ui";
import {
  BottomSheet,
  type BottomSheetHandle,
} from "@/components/ui/bottom-sheet";
import { communityMutations } from "@/lib/api/community";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type DeletePostButtonProps = { postId: string };

/** Confirms before Go removes the post (it is retained for moderation). */
export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const sheetRef = useRef<BottomSheetHandle>(null);
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useMutation(communityMutations.deletePost());
  return (
    <>
      <Button variant="danger-ghost" onClick={() => setIsOpen(true)}>
        Excluir publicação
      </Button>
      {isOpen ? (
        <BottomSheet
          ref={sheetRef}
          title="Excluir publicação?"
          isBusy={mutation.isPending}
          onClose={() => {
            setIsOpen(false);
            mutation.reset();
          }}
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-neutral-600">
              A publicação deixará de aparecer no perfil da ONG e no feed de
              quem a segue. Essa ação não pode ser desfeita.
            </p>
            <FormError id="delete-post-error" collapsible>
              {mutation.error?.message}
            </FormError>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="min-h-11 flex-1 shadow-none!"
                disabled={mutation.isPending}
                onClick={() => sheetRef.current?.close()}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="min-h-11 flex-1 shadow-none!"
                loading={mutation.isPending}
                onClick={() =>
                  mutation.mutate(postId, {
                    onSuccess: () => {
                      router.push("/ngo/posts");
                      router.refresh();
                    },
                  })
                }
              >
                Excluir
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
