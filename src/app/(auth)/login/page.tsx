import { PhotoAuthLayout } from "@/components/auth/photo-auth-layout";
import type { Metadata } from "next";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Entrar – Petfinder",
};

export default function LoginPage() {
  return (
    <PhotoAuthLayout>
      <LoginForm />
    </PhotoAuthLayout>
  );
}
