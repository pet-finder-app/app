import { BackendShell } from "@/components/backend/backend-shell";
import { SurrenderForm } from "@/components/workflows/surrender-form";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ application?: string | string[] }>;
}) {
  await getCurrentUser();
  const { application } = await searchParams;
  return (
    <BackendShell title="Entregar ou devolver um animal">
      <p>
        A ONG analisa a solicitação. Se ela aceitar, vocês assinam um termo e
        confirmam a entrega com um código enviado por e-mail.
      </p>
      <SurrenderForm
        initialApplicationId={
          typeof application === "string" ? application : undefined
        }
      />
    </BackendShell>
  );
}
