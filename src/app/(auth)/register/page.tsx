import { PhotoAuthLayout } from "@/components/auth/photo-auth-layout";
import type { Metadata } from "next";
import { RegisterFlow } from "./_components/register-flow";

export const metadata: Metadata = {
  title: "Criar conta – Petfinder",
};

export default function RegisterPage() {
  return (
    <PhotoAuthLayout registration>
      <RegisterFlow />
    </PhotoAuthLayout>
  );
}
