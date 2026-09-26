import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OngProfileForm } from "./ong-profile-form";

export const metadata: Metadata = {
  title: "Perfil da ONG – Petfinder",
};

export default async function OngProfilePage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  return <OngProfileForm initialProfile={user.ong} />;
}
