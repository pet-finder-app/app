import { PhotoAuthLayout } from "@/components/auth/photo-auth-layout";
import Link from "next/link";
export default function Page() {
  return (
    <PhotoAuthLayout heading="Redefinir senha">
      <p className="text-text-light">
        A recuperação de senha ainda não está disponível.
      </p>
      <Link href="/login" className="text-text-light underline">
        Voltar para entrar
      </Link>
    </PhotoAuthLayout>
  );
}
