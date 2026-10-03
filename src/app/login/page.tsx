import { AuthLayout } from "@/components/auth-layout";
import { LinkButton } from "@/components/ui";
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
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-sm">Novo por aqui?</span>
          <LinkButton
            href="/cadastro"
            variant="secondary"
            className="border border-neutral-900"
          >
            CRIAR CONTA
          </LinkButton>
        </div>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
