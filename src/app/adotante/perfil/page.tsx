import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdopterProfileForm } from "./adopter-profile-form";

export const metadata: Metadata = {
  title: "Meu perfil – Petfinder",
};

export default async function AdopterProfilePage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  return <AdopterProfileForm initialProfile={user.adopter} />;
}
