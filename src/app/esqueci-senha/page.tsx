import { AuthLayout } from "@/components/auth-layout";
import { TextLink } from "@/components/ui";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueceu a senha – Petfinder",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      heading="Esqueceu a senha"
      background="pastel"
      footer={
        <>
          Lembrou?{" "}
          <TextLink href="/login" tone="primary-pastel">
            Voltar para o login.
          </TextLink>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
