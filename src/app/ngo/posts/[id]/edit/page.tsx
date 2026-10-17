import { PostForm } from "@/components/posts/post-form";
import { listPetsByNgo } from "@/lib/pets";
import { getPostByIdAndNgo } from "@/lib/posts";
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
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const post = await getPostByIdAndNgo(id, user.id);
  if (!post) notFound();

  const pets = (await listPetsByNgo(user.id)).filter(
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
