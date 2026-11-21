import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";
import { PhotoAuthLayout } from "@/components/auth/photo-auth-layout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recuperar senha – Petfinder" };

export default function Page() {
  return (
    <PhotoAuthLayout heading="Recuperar senha">
      <PasswordRecoveryForm mode="request" />
    </PhotoAuthLayout>
  );
}
