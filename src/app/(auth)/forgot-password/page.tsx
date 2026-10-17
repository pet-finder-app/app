import { PhotoAuthLayout } from "@/components/auth/photo-auth-layout";
import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueceu a senha – Petfinder",
};

export default function ForgotPasswordPage() {
  return (
    <PhotoAuthLayout
      heading="Esqueceu a senha"
      footer={
        <>
          Lembrou?{" "}
          <Link href="/login">
            <strong>Voltar para o login.</strong>
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </PhotoAuthLayout>
  );
}
