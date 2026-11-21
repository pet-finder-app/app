import { BackendShell } from "@/components/backend/backend-shell";
import { getCurrentUser, isPlatformAdmin } from "@/lib/backend/server";
import { notFound } from "next/navigation";
import { VerificationQueue } from "./_components/verification-queue";

export default async function Page() {
  const user = await getCurrentUser();
  if (!isPlatformAdmin(user)) notFound();
  return (
    <BackendShell title="Verificações">
      <VerificationQueue />
    </BackendShell>
  );
}
