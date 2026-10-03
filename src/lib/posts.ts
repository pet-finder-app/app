import { promises as fs } from "node:fs";
import path from "node:path";
import { createEmptyPetInput, type PetInput } from "./pet";
import { createPet, getPetByIdAndOng } from "./pets";
import {
  clampTagPos,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  mediaTypeOf,
  POST_MIME_EXTENSION,
  validatePostInput,
  type Post,
  type PostInput,
  type PostMedia,
  type TagPos,
} from "./post";

/**
 * Camada de acesso aos posts — hoje um arquivo JSON + arquivos em
 * `public/uploads/posts`, amanhã o backend e um storage de verdade. Só este
 * arquivo precisa mudar quando a API real entrar (ver `lib/pets.ts`).
 */

const POSTS_FILE = path.join(process.cwd(), "src", "data", "posts.json");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "posts");

/** Erro com mensagem pronta para mostrar ao usuário (vira 400 na API). */
export class PostError extends Error {}

export async function readPosts(): Promise<Post[]> {
  const raw = await fs.readFile(POSTS_FILE, "utf-8");
  return (JSON.parse(raw) as { posts: Post[] }).posts;
}

async function writePosts(posts: Post[]): Promise<void> {
  await fs.writeFile(
    POSTS_FILE,
    JSON.stringify({ posts }, null, 2) + "\n",
    "utf-8",
  );
}

/** Mais recentes primeiro. */
export async function listPostsByOng(ongId: string): Promise<Post[]> {
  const posts = await readPosts();
  return posts
    .filter((post) => post.ongId === ongId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Só retorna o post se ele pertencer a essa ONG. */
export async function getPostByIdAndOng(
  id: string,
  ongId: string,
): Promise<Post | undefined> {
  const posts = await readPosts();
  return posts.find((post) => post.id === id && post.ongId === ongId);
}

async function saveFiles(files: File[]): Promise<PostMedia[]> {
  const extensions = files.map((file) => POST_MIME_EXTENSION[file.type]);
  files.forEach((file, index) => {
    if (!extensions[index])
      throw new PostError(`"${file.name}" não é uma foto ou vídeo aceito.`);
    const limit =
      mediaTypeOf(file.type) === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit)
      throw new PostError(`"${file.name}" passa de ${limit / 1024 / 1024} MB.`);
  });

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  return Promise.all(
    files.map(async (file, index) => {
      const fileName = `${crypto.randomUUID()}${extensions[index]}`;
      await fs.writeFile(
        path.join(UPLOAD_DIR, fileName),
        Buffer.from(await file.arrayBuffer()),
      );
      return {
        url: `/uploads/posts/${fileName}`,
        type: mediaTypeOf(file.type),
        mimeType: file.type,
        name: file.name,
        size: file.size,
      };
    }),
  );
}

/** Lê o multipart do formulário: `data` (JSON de `PostInput`) + `files`. */
function parseForm(form: FormData): { input: PostInput; files: File[] } {
  const raw = form.get("data");
  if (typeof raw !== "string") throw new PostError("Dados inválidos.");

  let input: PostInput;
  try {
    input = JSON.parse(raw) as PostInput;
  } catch {
    throw new PostError("Dados inválidos.");
  }
  if (typeof input.caption !== "string" || !Array.isArray(input.keepMedia))
    throw new PostError("Dados inválidos.");

  const files = form
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  return { input, files };
}

/** Resolve a marcação: pet existente da ONG, pet recém-cadastrado ou nenhum. */
async function resolvePetId(
  ongId: string,
  input: PostInput,
  media: PostMedia[],
): Promise<string | null> {
  if (input.newPet) {
    const petInput: PetInput = {
      ...createEmptyPetInput(),
      ...input.newPet,
      name: input.newPet.name.trim(),
      description: input.caption.trim(),
      photos: media
        .filter((item) => item.type === "image")
        .map((item) => ({
          name: item.name,
          size: item.size,
          mimeType: item.mimeType,
          uploadedAt: new Date().toISOString(),
          url: item.url,
        })),
    };
    return (await createPet(ongId, petInput)).id;
  }

  if (input.petId) {
    const pet = await getPetByIdAndOng(input.petId, ongId);
    if (!pet) throw new PostError("Pet não encontrado.");
    return pet.id;
  }
  return null;
}

/** Valida, salva os arquivos e junta com as mídias mantidas. */
async function buildMedia(
  input: PostInput,
  files: File[],
  existing: PostMedia[],
): Promise<PostMedia[]> {
  const kept = existing.filter((item) =>
    input.keepMedia.some((keep) => keep.url === item.url),
  );
  const total = kept.length + files.length;
  const images =
    kept.filter((m) => m.type === "image").length +
    files.filter((f) => mediaTypeOf(f.type) === "image").length;

  const error = validatePostInput(input, total, images);
  if (error) throw new PostError(error);

  const saved = await saveFiles(files);
  if (!input.order) return [...kept, ...saved];

  const ordered = input.order.flatMap((token) => {
    const item = token.startsWith("file:")
      ? saved[Number(token.slice(5))]
      : kept.find((m) => m.url === token);
    return item ? [item] : [];
  });
  // Qualquer mídia que ficou fora da ordem enviada vai para o fim.
  const rest = [...kept, ...saved].filter((m) => !ordered.includes(m));
  return [...ordered, ...rest];
}

/** Só guarda a posição se houver pet marcado e os números forem válidos. */
function cleanTagPos(input: PostInput, petId: string | null): TagPos | null {
  const pos = input.tagPos;
  if (!petId || !pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y))
    return null;
  return clampTagPos(pos);
}

export async function createPost(ongId: string, form: FormData): Promise<Post> {
  const { input, files } = parseForm(form);
  const media = await buildMedia(input, files, []);
  const petId = await resolvePetId(ongId, input, media);

  const now = new Date().toISOString();
  const post: Post = {
    id: crypto.randomUUID(),
    ongId,
    petId,
    tagPos: cleanTagPos(input, petId),
    caption: input.caption.trim(),
    media,
    createdAt: now,
    updatedAt: now,
  };
  await writePosts([...(await readPosts()), post]);
  return post;
}

/** Retorna undefined se o post não existir ou não pertencer a essa ONG. */
export async function updatePost(
  id: string,
  ongId: string,
  form: FormData,
): Promise<Post | undefined> {
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id && p.ongId === ongId);
  if (index === -1) return undefined;

  const { input, files } = parseForm(form);
  const media = await buildMedia(input, files, posts[index].media);
  const petId = await resolvePetId(ongId, input, media);

  const updated: Post = {
    ...posts[index],
    petId,
    tagPos: cleanTagPos(input, petId),
    caption: input.caption.trim(),
    media,
    updatedAt: new Date().toISOString(),
  };
  posts[index] = updated;
  await writePosts(posts);
  return updated;
}

/** Apaga o post (os arquivos ficam: um pet cadastrado por ele pode usá-los). */
export async function deletePost(id: string, ongId: string): Promise<boolean> {
  const posts = await readPosts();
  const index = posts.findIndex((p) => p.id === id && p.ongId === ongId);
  if (index === -1) return false;

  posts.splice(index, 1);
  await writePosts(posts);
  return true;
}

/** Apaga todos os posts de uma ONG (exclusão de conta). */
export async function deletePostsByOng(ongId: string): Promise<void> {
  const posts = await readPosts();
  await writePosts(posts.filter((p) => p.ongId !== ongId));
}
