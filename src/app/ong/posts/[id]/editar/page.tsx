import { PostForm } from "@/components/post-form";
import { listPetsByOng } from "@/lib/pets";
import { getPostByIdAndOng } from "@/lib/posts";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Editar post – Petfinder",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const post = await getPostByIdAndOng(id, user.id);
  if (!post) notFound();

  const pets = (await listPetsByOng(user.id)).filter(
    (pet) => !pet.archived || pet.id === post.petId,
  );

  return (
    <PostForm
      mode="edit"
      post={post}
      pets={pets.map((pet) => ({ id: pet.id, name: pet.name }))}
    />
  );
}
