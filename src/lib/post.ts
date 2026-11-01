import type { PetAgeGroup, PetSex, PetSize, PetSpecies } from "./pet";

/** Client-safe media model shared by the reusable carousel controls. */

export type PostMediaType = "image" | "video";

export type PostMedia = {
  /** App-served media path, including uploaded post files or bundled pet photos. */
  url: string;
  type: PostMediaType;
  mimeType: string;
  name: string;
  size: number;
};

export type TagPos = { x: number; y: number };

/** Default pet-name tag position when no custom position was selected. */
export const DEFAULT_TAG_POS: TagPos = { x: 24, y: 9 };

/** Keep the tag center inside the image bounds. */
export function clampTagPos(pos: TagPos): TagPos {
  const clamp = (v: number) =>
    Math.min(90, Math.max(10, Math.round(v * 10) / 10));
  return { x: clamp(pos.x), y: clamp(pos.y) };
}

export type Post = {
  id: string;
  /** Identifier of the NGO that published this pet. */
  ngoId: string;
  /** Tagged pet identifier; null means no linked pet. */
  petId: string | null;
  /** Pet-tag center as image percentages; absent values use the default position. */
  tagPos?: TagPos | null;
  caption: string;
  media: PostMedia[];
  /** ISO timestamp. */
  createdAt: string;
  updatedAt: string;
};

/** Minimum fields for creating a pet directly from the post form. */
export type PostNewPet = {
  name: string;
  species: PetSpecies;
  sex: PetSex;
  size: PetSize;
  ageGroup: PetAgeGroup;
};

/** PostInput is submitted as multipart JSON alongside new files. keepMedia contains previously saved media retained in the post. */
export type PostInput = {
  caption: string;
  petId: string | null;
  newPet: PostNewPet | null;
  tagPos?: TagPos | null;
  keepMedia: PostMedia[];
  /** Final media ordering: an existing URL or file:N for the Nth newly uploaded file. */
  order?: string[];
};

export const MAX_POST_MEDIA = 10;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Accepted MIME types and storage extensions. */
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
    species: "dog",
    sex: "male",
    size: "medium",
    ageGroup: "adult",
  };
}

/** First validation error, or null. mediaCount includes retained and new media; imageCount includes only photos. */
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
