import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type PostLike = { adopterId: string; postId: string };
const POST_LIKES_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "post-likes.json",
);
let pendingWrite: Promise<void> = Promise.resolve();

function isPostLike(value: unknown): value is PostLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "adopterId" in value &&
    typeof value.adopterId === "string" &&
    "postId" in value &&
    typeof value.postId === "string"
  );
}

async function readPostLikes(): Promise<PostLike[]> {
  try {
    const data: unknown = JSON.parse(await readFile(POST_LIKES_FILE, "utf-8"));
    if (!Array.isArray(data) || !data.every(isPostLike))
      throw new Error("Invalid post likes store");
    return data;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    )
      return [];
    throw error;
  }
}

export async function listLikedPostIds(adopterId: string): Promise<string[]> {
  return (await readPostLikes())
    .filter((like) => like.adopterId === adopterId)
    .map((like) => like.postId);
}

/** Serialize local writes so simultaneous likes do not overwrite one another. */
export async function togglePostLike(
  adopterId: string,
  postId: string,
  desiredLiked?: boolean,
): Promise<{ liked: boolean }> {
  const operation = pendingWrite.then(async () => {
    const likes = await readPostLikes();
    const exists = likes.some(
      (like) => like.adopterId === adopterId && like.postId === postId,
    );
    if (desiredLiked !== undefined && desiredLiked === exists)
      return { liked: desiredLiked };
    const liked = !exists;
    const updated = liked
      ? [...likes, { adopterId, postId }]
      : likes.filter(
          (like) => like.adopterId !== adopterId || like.postId !== postId,
        );
    await writeFile(
      POST_LIKES_FILE,
      `${JSON.stringify(updated, null, 2)}\n`,
      "utf-8",
    );
    return { liked };
  });
  pendingWrite = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

/** Remove preferences with the account, serialized with pending like updates. */
export async function deletePostLikesOfUser(adopterId: string): Promise<void> {
  const operation = pendingWrite.then(async () => {
    const likes = await readPostLikes();
    const remaining = likes.filter((like) => like.adopterId !== adopterId);
    if (remaining.length === likes.length) return;
    await writeFile(
      POST_LIKES_FILE,
      `${JSON.stringify(remaining, null, 2)}\n`,
      "utf-8",
    );
  });
  pendingWrite = operation.then(
    () => undefined,
    () => undefined,
  );
  await operation;
}
