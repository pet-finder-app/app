"use client";

import { BrutalButton, BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import {
  CardDescription,
  CardTitle,
  FormError,
  iconSize,
  Input,
  MediaInput,
  PageShell,
  Select,
  Textarea,
  type MediaItem,
} from "@/components/ui";
import {
  PET_AGE_GROUP_LABEL,
  PET_SEX_LABEL,
  PET_SIZE_LABEL,
  PET_SPECIES_KEYS,
  PET_SPECIES_LABEL,
  type PetAgeGroup,
  type PetSex,
  type PetSize,
  type PetSpecies,
} from "@/lib/pet";
import {
  clampTagPos,
  createEmptyNewPet,
  DEFAULT_TAG_POS,
  MAX_POST_MEDIA,
  POST_ACCEPT,
  validatePostInput,
  type Post,
  type PostInput,
  type PostNewPet,
  type TagPos,
} from "@/lib/post";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

const ERROR_ID = "post-form-error";
const NEW_PET = "novo";
const NO_PET = "";

type PostFormProps = {
  /** Pets da ONG que podem ser marcados no post. */
  pets: { id: string; name: string }[];
} & ({ mode: "create" } | { mode: "edit"; post: Post });

/**
 * Formulário de post, compartilhado entre criar (`/ong/posts/novo`) e editar
 * (`/ong/posts/[id]/editar`): fotos e vídeos (vários, como no Instagram),
 * legenda e o pet marcado — um já cadastrado ou um novo, cadastrado ali mesmo.
 */
export function PostForm(props: PostFormProps) {
  const router = useRouter();
  const editing = props.mode === "edit";
  const [media, setMedia] = useState<MediaItem[]>(
    props.mode === "edit"
      ? props.post.media.map((item) => ({
          key: item.url,
          url: item.url,
          type: item.type,
          name: item.name,
        }))
      : [],
  );
  const [caption, setCaption] = useState(
    props.mode === "edit" ? props.post.caption : "",
  );
  const [petChoice, setPetChoice] = useState(
    props.mode === "edit" ? (props.post.petId ?? NO_PET) : NO_PET,
  );
  const [tagPos, setTagPos] = useState<TagPos>(
    props.mode === "edit"
      ? (props.post.tagPos ?? DEFAULT_TAG_POS)
      : DEFAULT_TAG_POS,
  );
  const [newPet, setNewPet] = useState<PostNewPet>(createEmptyNewPet());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function patchNewPet(changes: Partial<PostNewPet>) {
    setNewPet((prev) => ({ ...prev, ...changes }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const isNew = petChoice === NEW_PET;
    const input: PostInput = {
      caption,
      petId: isNew || petChoice === NO_PET ? null : petChoice,
      newPet: isNew ? newPet : null,
      tagPos: petChoice === NO_PET ? null : tagPos,
      keepMedia:
        props.mode === "edit"
          ? props.post.media.filter((item) =>
              media.some((m) => !m.file && m.url === item.url),
            )
          : [],
    };

    const validationError = validatePostInput(
      input,
      media.length,
      media.filter((m) => m.type === "image").length,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    let fileIndex = 0;
    input.order = media.map((m) => (m.file ? `file:${fileIndex++}` : m.url));

    const body = new FormData();
    body.append("data", JSON.stringify(input));
    media.forEach((m) => m.file && body.append("files", m.file));

    setIsSubmitting(true);
    try {
      const response = await fetch(
        props.mode === "edit"
          ? `/api/ong/posts/${props.post.id}`
          : "/api/ong/posts",
        { method: props.mode === "edit" ? "PUT" : "POST", body },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ??
            (editing
              ? "Não foi possível salvar o post."
              : "Não foi possível publicar o post."),
        );
        return;
      }

      router.push(editing ? `/ong/posts/${props.post.id}` : "/?criado=post");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente de novo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const mediaInvalid = error?.startsWith("Adicione") || error?.includes("foto");

  return (
    <PageShell>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <BrutalCard as="header" className="gap-2">
          <BrutalLinkButton
            href={editing ? `/ong/posts/${props.post.id}` : "/"}
            variant="pill"
            size="sm"
            className="self-start"
          >
            <ChevronLeft className={iconSize.sm} aria-hidden="true" />
            {editing ? "Post" : "Início"}
          </BrutalLinkButton>
          <CardTitle>{editing ? "Editar post" : "Novo post"}</CardTitle>
          <CardDescription>
            {editing
              ? "Troque as mídias, ajuste a legenda ou mude o pet marcado."
              : "Compartilhe fotos e vídeos e marque o pet do post."}
          </CardDescription>
        </BrutalCard>

        <BrutalCard className="gap-3">
          <MediaInput
            id="media"
            label="Fotos e vídeos"
            tone="brutal"
            hint={`Até ${MAX_POST_MEDIA} arquivos. Fotos até 10 MB, vídeos até 50 MB. A primeira é a capa; use as setas para reordenar.`}
            accept={POST_ACCEPT}
            maxFiles={MAX_POST_MEDIA}
            value={media}
            onChange={setMedia}
            invalid={!!mediaInvalid}
            errorId={ERROR_ID}
          />

          <Textarea
            id="caption"
            label="Legenda"
            tone="brutal"
            placeholder="Conte a história, como o pet está hoje..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            invalid={error?.includes("legenda")}
            errorId={ERROR_ID}
          />
        </BrutalCard>

        <BrutalCard className="gap-3">
          <Select
            id="pet"
            label="Pet marcado"
            tone="brutal"
            hint="O nome aparece sobre a foto, como uma marcação."
            value={petChoice}
            onChange={(e) => setPetChoice(e.target.value)}
            options={[
              { value: NO_PET, label: "Nenhum pet" },
              ...props.pets.map((pet) => ({ value: pet.id, label: pet.name })),
              { value: NEW_PET, label: "+ Cadastrar novo pet" },
            ]}
          />

          {petChoice !== NO_PET && media[0] ? (
            <TagPositionPicker
              cover={media[0]}
              name={
                petChoice === NEW_PET
                  ? newPet.name.trim() || "Novo pet"
                  : (props.pets.find((p) => p.id === petChoice)?.name ?? "Pet")
              }
              value={tagPos}
              onChange={setTagPos}
            />
          ) : null}

          {petChoice === NEW_PET ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-neutral-900 bg-primary-faint p-3">
              <p className="text-sm text-neutral-900">
                A legenda vira a descrição do pet e as fotos do post viram as
                fotos dele. Depois você completa o resto em “Editar pet”.
              </p>
              <Input
                id="newPetName"
                label="Nome do pet"
                required
                tone="brutal"
                value={newPet.name}
                onChange={(e) => patchNewPet({ name: e.target.value })}
                invalid={error?.includes("nome")}
                errorId={ERROR_ID}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  id="newPetSpecies"
                  label="Espécie"
                  tone="brutal"
                  value={newPet.species}
                  onChange={(e) =>
                    patchNewPet({ species: e.target.value as PetSpecies })
                  }
                  options={PET_SPECIES_KEYS.map((key) => ({
                    value: key,
                    label: PET_SPECIES_LABEL[key],
                  }))}
                />
                <Select
                  id="newPetSex"
                  label="Sexo"
                  tone="brutal"
                  value={newPet.sex}
                  onChange={(e) =>
                    patchNewPet({ sex: e.target.value as PetSex })
                  }
                  options={(Object.keys(PET_SEX_LABEL) as PetSex[]).map(
                    (key) => ({ value: key, label: PET_SEX_LABEL[key] }),
                  )}
                />
                <Select
                  id="newPetSize"
                  label="Porte"
                  tone="brutal"
                  value={newPet.size}
                  onChange={(e) =>
                    patchNewPet({ size: e.target.value as PetSize })
                  }
                  options={(Object.keys(PET_SIZE_LABEL) as PetSize[]).map(
                    (key) => ({ value: key, label: PET_SIZE_LABEL[key] }),
                  )}
                />
                <Select
                  id="newPetAgeGroup"
                  label="Idade"
                  tone="brutal"
                  value={newPet.ageGroup}
                  onChange={(e) =>
                    patchNewPet({ ageGroup: e.target.value as PetAgeGroup })
                  }
                  options={(
                    Object.keys(PET_AGE_GROUP_LABEL) as PetAgeGroup[]
                  ).map((key) => ({
                    value: key,
                    label: PET_AGE_GROUP_LABEL[key],
                  }))}
                />
              </div>
            </div>
          ) : null}
        </BrutalCard>

        <FormError id={ERROR_ID}>{error}</FormError>

        <BrutalButton
          type="submit"
          size="lg"
          loading={isSubmitting}
          loadingLabel={editing ? "SALVANDO..." : "PUBLICANDO..."}
        >
          {editing ? "SALVAR POST" : "PUBLICAR POST"}
        </BrutalButton>
      </form>
    </PageShell>
  );
}

/**
 * Prévia da capa com o balão do nome do pet: arraste (ou use as setas do
 * teclado) para escolher onde a marcação fica sobre a foto.
 */
function TagPositionPicker({
  cover,
  name,
  value,
  onChange,
}: {
  cover: MediaItem;
  name: string;
  value: TagPos;
  onChange: (pos: TagPos) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function moveTo(event: PointerEvent<HTMLElement>) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(
      clampTagPos({
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      }),
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 10 : 2;
    const delta: Record<string, TagPos> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = delta[event.key];
    if (!d) return;
    event.preventDefault();
    onChange(clampTagPos({ x: value.x + d.x, y: value.y + d.y }));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-bold text-neutral-900">
        Posição da marcação
      </span>
      <div
        ref={areaRef}
        className="relative aspect-square touch-none overflow-hidden rounded-xl border border-neutral-900 bg-neutral-100"
      >
        {cover.type === "video" ? (
          <video
            src={cover.url}
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="size-full object-cover"
          />
        ) : (
          <Image
            src={cover.url}
            alt=""
            fill
            unoptimized
            sizes="500px"
            className="object-cover"
          />
        )}
        <button
          type="button"
          aria-label={`Marcação de ${name}. Arraste ou use as setas do teclado para mover.`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            moveTo(event);
          }}
          onPointerMove={(event) => dragging && moveTo(event)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={handleKeyDown}
          style={{ left: `${value.x}%`, top: `${value.y}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 touch-none rounded-2xl border-2 border-neutral-900 bg-yellow-200 px-3 py-1.5 text-xs font-bold text-neutral-900 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        >
          {name}
        </button>
      </div>
      <p className="text-xs text-neutral-600">
        Arraste o nome para onde quiser na foto.
      </p>
    </div>
  );
}
