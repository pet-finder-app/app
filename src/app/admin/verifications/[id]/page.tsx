import { BackendShell } from "@/components/backend/backend-shell";
import { getCurrentUser, isPlatformAdmin } from "@/lib/backend/server";
import { notFound } from "next/navigation";
import { VerificationReview } from "../_components/verification-review";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!isPlatformAdmin(user)) notFound();
  const { id } = await params;
  return (
    <BackendShell title="Analisar verificação" hasNavigation={false}>
      <VerificationReview id={id} />
    </BackendShell>
  );
}
