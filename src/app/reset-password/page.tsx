import { AuthLayout } from "@/components/auth/auth-layout";
import { LinkButton, TextLink } from "@/components/ui";
import type { Metadata } from "next";
import { ResetPasswordForm } from "./_components/reset-password-form";

export const metadata: Metadata = {
  title: "Nova senha – Petfinder",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthLayout
      heading="Nova senha"
      background="pastel"
      footer={
        <TextLink href="/login" tone="primary-pastel">
          Voltar para o login.
        </TextLink>
      }
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div role="alert" className="flex flex-col gap-3 text-center">
          <p className="text-sm font-semibold text-neutral-900">
            Link inválido. Peça um novo link de recuperação.
          </p>
          <LinkButton href="/forgot-password" variant="dark" size="lg">
            PEDIR NOVO LINK
          </LinkButton>
        </div>
      )}
    </AuthLayout>
  );
}
