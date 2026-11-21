import { BackendShell } from "@/components/backend/backend-shell";
import { AdoptionAgreement } from "@/components/workflows/adoption-agreement";
import { getViewerAccess } from "@/components/workflows/viewer-access";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { access, hasOrganization } = await getViewerAccess();
  return (
    <BackendShell title="Termo de adoção" organization={hasOrganization}>
      <AdoptionAgreement applicationId={id} access={access} />
    </BackendShell>
  );
}
