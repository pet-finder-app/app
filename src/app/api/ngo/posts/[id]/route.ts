import { deletePost, PostError, updatePost } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function requireNgo() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;
  return user && user.role === "ngo" && user.ngo ? user : null;
}

const UNAUTHORIZED = {
  message: "Faça login com uma conta de ONG.",
};
const NOT_FOUND = { message: "Post não encontrado." };

/** Update a post's caption, pet tag, and media using the same multipart format as creation. Ownership is required. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireNgo();
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

/** Delete a post owned by the current NGO. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireNgo();
  if (!user) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  if (!(await deletePost(id, user.id)))
    return NextResponse.json(NOT_FOUND, { status: 404 });
  return NextResponse.json({ ok: true });
}
