import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";
import {
  LOGIN_FOOTER,
  PhotoAuthLayout,
} from "@/components/auth/photo-auth-layout";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Redefinir senha – Petfinder" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <PhotoAuthLayout heading="Redefinir senha" footer={LOGIN_FOOTER}>
      {typeof token === "string" && token.length >= 32 ? (
        <PasswordRecoveryForm mode="reset" token={token} />
      ) : (
        <>
          <p className="text-text-light">
            Este link de redefinição é inválido. Solicite um novo.
          </p>
          <Link href="/forgot-password" className="text-text-light underline">
            Recuperar senha
          </Link>
        </>
      )}
    </PhotoAuthLayout>
  );
}
