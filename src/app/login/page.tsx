import { AuthLayout } from "@/components/auth-layout";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar – Petfinder",
};

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Entrar"
      footer={
        <>
          Não possui uma conta?{" "}
          <Link
            href="/cadastro"
            className="text-brand underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Crie uma aqui.
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
