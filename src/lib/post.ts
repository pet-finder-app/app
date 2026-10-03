import type { PetAgeGroup, PetSex, PetSize, PetSpecies } from "./pet";

/**
 * Modelo de dados do post de uma ONG (estilo Instagram): legenda, uma ou
 * mais mídias (fotos e vídeos) e, opcionalmente, o pet marcado. Fica em
 * `posts.json` — o backend pode virar uma tabela própria depois, ligada à
 * ONG por `ongId` e ao pet por `petId`.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export type PostMediaType = "image" | "video";

export type PostMedia = {
  /** Caminho servido pelo app (`/uploads/posts/...` ou `/pets/...`). */
  url: string;
  type: PostMediaType;
  mimeType: string;
  name: string;
  size: number;
};

export type TagPos = { x: number; y: number };

/** Onde o balão do nome aparece quando a ONG não escolheu um lugar. */
export const DEFAULT_TAG_POS: TagPos = { x: 24, y: 9 };

/** Mantém o centro do balão dentro da foto. */
export function clampTagPos(pos: TagPos): TagPos {
  const clamp = (v: number) =>
    Math.min(90, Math.max(10, Math.round(v * 10) / 10));
  return { x: clamp(pos.x), y: clamp(pos.y) };
}

export type Post = {
  id: string;
  /** `StoredUser.id` da ONG que publicou. */
  ongId: string;
  /** Pet marcado no post. Null = post sem pet vinculado. */
  petId: string | null;
  /** Posição da marcação do pet sobre a foto, em % (centro do balão). Ausente = padrão. */
  tagPos?: TagPos | null;
  caption: string;
  media: PostMedia[];
  /** ISO datetime. */
  createdAt: string;
  updatedAt: string;
};

/** Dados mínimos para cadastrar um pet novo direto do formulário do post. */
export type PostNewPet = {
  name: string;
  species: PetSpecies;
  sex: PetSex;
  size: PetSize;
  ageGroup: PetAgeGroup;
};

/**
 * O que o formulário envia (no campo `data` do multipart; os arquivos novos
 * vão ao lado). `keepMedia` são as mídias já salvas que continuam no post.
 */
export type PostInput = {
  caption: string;
  petId: string | null;
  newPet: PostNewPet | null;
  tagPos?: TagPos | null;
  keepMedia: PostMedia[];
  /** Ordem final: URL de mídia mantida ou `file:N` (N-ésimo arquivo novo). */
  order?: string[];
};

export const MAX_POST_MEDIA = 10;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Tipos aceitos e a extensão com que são salvos. */
export const POST_MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export const POST_ACCEPT = Object.keys(POST_MIME_EXTENSION).join(",");

export function mediaTypeOf(mimeType: string): PostMediaType {
  return mimeType.startsWith("video/") ? "video" : "image";
}

export function createEmptyNewPet(): PostNewPet {
  return {
    name: "",
    species: "cachorro",
    sex: "macho",
    size: "medio",
    ageGroup: "adulto",
  };
}

/**
 * Mensagem do primeiro problema, ou null se tudo certo. `mediaCount` é o
 * total final (mantidas + novas); `imageCount`, quantas delas são fotos.
 */
export function validatePostInput(
  input: Pick<PostInput, "caption" | "petId" | "newPet">,
  mediaCount: number,
  imageCount: number,
): string | null {
  if (mediaCount === 0) return "Adicione ao menos uma foto ou vídeo.";
  if (mediaCount > MAX_POST_MEDIA)
    return `Um post aceita no máximo ${MAX_POST_MEDIA} arquivos.`;
  if (input.newPet) {
    if (!input.newPet.name.trim()) return "Dê um nome para o novo pet.";
    if (imageCount === 0)
      return "Para cadastrar um pet novo, inclua ao menos uma foto.";
    if (!input.caption.trim())
      return "Escreva a legenda — ela vira a descrição do novo pet.";
  }
  return null;
}
