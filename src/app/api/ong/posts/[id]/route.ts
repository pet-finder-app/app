import { deletePost, PostError, updatePost } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireOng() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  return user && user.role === "ong" && user.ong ? user : null;
}

const UNAUTHORIZED = {
  message: "Faça login com uma conta de ONG.",
};
const NOT_FOUND = { message: "Post não encontrado." };

/**
 * PUT /api/ong/posts/[id] — edita legenda, pet marcado e mídias do post.
 * Mesmo body do POST. Só o dono (a ONG que publicou) pode editar.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireOng();
  if (!user) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  try {
    const post = await updatePost(id, user.id, await request.formData());
    if (!post) return NextResponse.json(NOT_FOUND, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof PostError)
      return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}

/** DELETE /api/ong/posts/[id] — apaga o post. Só o dono pode apagar. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireOng();
  if (!user) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  if (!(await deletePost(id, user.id)))
    return NextResponse.json(NOT_FOUND, { status: 404 });
  return NextResponse.json({ ok: true });
}
