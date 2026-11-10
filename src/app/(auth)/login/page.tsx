import { PhotoAuthLayout } from "@/components/auth/photo-auth-layout";
import { redirectPage } from "@/lib/auth-redirect";
import type { Metadata } from "next";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Entrar – Petfinder",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const destination = redirectPage((await searchParams).page);
  return (
    <PhotoAuthLayout>
      <LoginForm destination={destination} />
    </PhotoAuthLayout>
  );
}
