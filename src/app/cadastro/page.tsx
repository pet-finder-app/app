import { AuthLayout } from "@/components/auth-layout";
import type { Metadata } from "next";
import Link from "next/link";
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
          <Link
            href="/login"
            className="text-brand underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Entre aqui.
          </Link>
        </>
      }
    >
      <RegisterFlow />
    </AuthLayout>
  );
}
