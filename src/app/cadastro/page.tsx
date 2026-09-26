import { AuthLayout } from "@/components/auth-layout";
import { TextLink } from "@/components/ui";
import type { Metadata } from "next";
import { RegisterFlow } from "./register-flow";

export const metadata: Metadata = {
  title: "Criar conta – Petfinder",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      heading="Criar conta"
      footer={
        <>
          Já possui uma conta?{" "}
          <TextLink href="/login" tone="primary">
            Entre aqui.
          </TextLink>
        </>
      }
    >
      <RegisterFlow />
    </AuthLayout>
  );
}
