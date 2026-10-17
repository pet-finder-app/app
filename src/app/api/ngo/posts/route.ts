import { createPost, PostError } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Publish a post using multipart data containing PostInput JSON and new media files. Requires a verified NGO. */
export async function POST(request: Request) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user || user.role !== "ngo" || !user.ngo) {
    return NextResponse.json(
      { message: "Faça login com uma conta de ONG." },
      { status: 401 },
    );
  }
  if (user.ngo.verification.status !== "verified") {
    return NextResponse.json(
      { message: "Sua ONG precisa estar verificada para publicar." },
      { status: 403 },
    );
  }

  try {
    const post = await createPost(user.id, await request.formData());
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof PostError)
      return NextResponse.json({ message: error.message }, { status: 400 });
    throw error;
  }
}
