import { togglePostLike } from "@/lib/post-likes";
import { readPosts } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Likes for standalone posts; tagged pets retain their existing like workflow. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  if (!user || user.role !== "adopter" || !user.adopter)
    return NextResponse.json(
      { message: "Faça login com uma conta de adotante." },
      { status: 401 },
    );
  const { id } = await params;
  const post = (await readPosts()).find((item) => item.id === id);
  if (!post)
    return NextResponse.json(
      { message: "Publicação não encontrada." },
      { status: 404 },
    );
  if (post.petId)
    return NextResponse.json(
      { message: "Curta o pet vinculado a esta publicação." },
      { status: 400 },
    );
  try {
    return NextResponse.json(
      await togglePostLike(
        user.id,
        id,
        request.method === "PUT" ? true : undefined,
      ),
    );
  } catch {
    return NextResponse.json(
      { message: "Não foi possível atualizar sua curtida." },
      { status: 500 },
    );
  }
}

export const PUT = POST;
