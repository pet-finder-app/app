import { BackendShell } from "@/components/backend/backend-shell";
import { DonateToOrganization } from "@/components/donations/donate-to-organization";
import { LinkButton } from "@/components/ui";
import { ApiError } from "@/lib/api/client";
import { organizationResponseSchema } from "@/lib/backend/contracts";
import { getCurrentUser, serverRequest } from "@/lib/backend/server";
import { notFound } from "next/navigation";

async function getOrganization(id: string) {
  try {
    return await serverRequest(
      `/v1/organizations/${encodeURIComponent(id)}`,
      organizationResponseSchema,
    );
  } catch (error: unknown) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status))
      return null;
    throw error;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ ngoId: string }>;
}) {
  const { ngoId } = await params;
  await getCurrentUser();
  const organization = await getOrganization(ngoId);
  if (!organization) notFound();
  const isVerified = organization.verificationStatus === "verified";
  return (
    <BackendShell title={`Doar para ${organization.name}`}>
      {isVerified ? (
        <DonateToOrganization
          organizationId={organization.id}
          organizationName={organization.name}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p role="status">
            Esta ONG não está verificada no momento e não pode receber doações
            pelo Petfinder.
          </p>
          <LinkButton href="/adopter/donate" variant="outline">
            Ver ONGs verificadas
          </LinkButton>
        </div>
      )}
    </BackendShell>
  );
}
