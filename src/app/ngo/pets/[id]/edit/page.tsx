import { PetForm } from "@/components/pets/pet-form";
import { getPetByIdAndNgo } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Editar pet – Petfinder",
};

export default async function EditPetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const pet = await getPetByIdAndNgo(id, user.id);
  if (!pet) notFound();

  const {
    id: _id,
    ngoId: _ngoId,
    status,
    createdAt,
    updatedAt,
    ...input
  } = pet;
  void _id;
  void _ngoId;
  void createdAt;
  void updatedAt;

  return (
    <PetForm
      mode="edit"
      petId={pet.id}
      initialInput={input}
      initialStatus={status}
    />
  );
}
