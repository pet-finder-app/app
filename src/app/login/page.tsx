import { AuthLayout } from "@/components/auth-layout";
import { TextLink } from "@/components/ui";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar – Petfinder",
};

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Entrar"
      background="pastel"
      footer={
        <>
          Não possui uma conta?{" "}
          <TextLink href="/cadastro" tone="primary-pastel">
            Crie uma aqui.
          </TextLink>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
