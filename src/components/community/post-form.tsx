"use client";

import type { MediaItem } from "@/components/ui";
import {
  Button,
  FormError,
  Input,
  MediaInput,
  Textarea,
} from "@/components/ui";
import {
  communityMutations,
  parseTags,
  POST_BODY_MAX,
  POST_MEDIA_MAX,
  POST_TAGS_MAX,
  postMediaHref,
} from "@/lib/api/community";
import { IMAGE_TYPES, uploadMedia } from "@/lib/api/mutations";
import type { PostResponse } from "@/lib/backend/contracts";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type PostFormProps = {
  organizationId: string;
  /** Existing post to edit; omit to publish a new one. */
  post?: PostResponse;
  /** Signed-in member; Go only accepts post media uploaded by the editor. */
  currentUserId?: string;
};

const ERROR_ID = "post-form-error";

/**
 * Publish or edit an organization post. New photos upload through Go media
 * (purpose "post") on submit; the post stores their ids in display order.
 */
export function PostForm({
  organizationId,
  post,
  currentUserId,
}: PostFormProps) {
  const router = useRouter();
  const [text, setText] = useState(post?.body ?? "");
  const [tags, setTags] = useState(
    post?.tags.map((tag) => `#${tag}`).join(" ") ?? "",
  );
  const [media, setMedia] = useState<MediaItem[]>(
    post?.mediaIds.map((id, index) => ({
      key: id,
      url: postMediaHref(id),
      type: "image",
      name: `${index + 1}`,
    })) ?? [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useMutation(communityMutations.createPost());
  const update = useMutation(communityMutations.updatePost());
  const isBusy = isUploading || create.isPending || update.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isBusy) return;
    setError(null);
    const body = text.trim();
    const parsedTags = parseTags(tags);
    if (!body) return setError("Escreva o texto da publicação.");
    if (parsedTags.length > POST_TAGS_MAX)
      return setError(`Use no máximo ${POST_TAGS_MAX} marcadores.`);
    try {
      setIsUploading(true);
      const mediaIds: string[] = [];
      // Sequential uploads keep the chosen order and Go's daily quota checks.
      for (const item of media) {
        if (!item.file) {
          mediaIds.push(item.key);
          continue;
        }
        const uploaded = await uploadMedia(item.file, "post");
        mediaIds.push(uploaded.id);
      }
      setIsUploading(false);
      const input = { body, mediaIds, tags: parsedTags };
      const saved = post
        ? await update.mutateAsync({ id: post.id, post: input })
        : await create.mutateAsync({ organizationId, post: input });
      router.push(`/ngo/posts/${encodeURIComponent(saved.id)}`);
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a publicação. Tente novamente.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Textarea
        id="post-body"
        label="Texto da publicação"
        required
        maxLength={POST_BODY_MAX}
        rows={6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        hint={`${text.length}/${POST_BODY_MAX} caracteres.`}
        errorId={ERROR_ID}
        invalid={Boolean(error) && !text.trim()}
      />
      <MediaInput
        id="post-media"
        label="Fotos"
        hint={`Até ${POST_MEDIA_MAX} imagens JPEG, PNG ou WebP de até 10 MB. A primeira é a capa.`}
        accept={IMAGE_TYPES.join(",")}
        maxFiles={POST_MEDIA_MAX}
        value={media}
        onChange={setMedia}
        errorId={ERROR_ID}
      />
      {post && post.mediaIds.length > 0 && post.authorId !== currentUserId ? (
        <p role="note" className="text-sm text-neutral-600">
          As fotos atuais foram enviadas por outra pessoa da equipe. Para salvar
          a edição, remova-as e envie novas fotos.
        </p>
      ) : null}
      <Input
        id="post-tags"
        label="Marcadores (opcional)"
        hint={`Separe por espaço ou vírgula, por exemplo: #adocao #gatos. Até ${POST_TAGS_MAX}.`}
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        errorId={ERROR_ID}
      />
      <FormError id={ERROR_ID}>{error}</FormError>
      <Button
        type="submit"
        size="lg"
        loading={isBusy}
        loadingLabel={isUploading ? "Enviando fotos…" : "Salvando…"}
      >
        {post ? "Salvar alterações" : "Publicar"}
      </Button>
    </form>
  );
}
