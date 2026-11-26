import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";
import {
  LOGIN_FOOTER,
  PhotoAuthLayout,
} from "@/components/auth/photo-auth-layout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Recuperar senha – Petfinder" };

export default function Page() {
  return (
    <PhotoAuthLayout heading="Recuperar senha" footer={LOGIN_FOOTER}>
      <PasswordRecoveryForm mode="request" />
    </PhotoAuthLayout>
  );
}
