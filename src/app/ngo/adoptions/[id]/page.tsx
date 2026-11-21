import { ApplicationDetail } from "@/components/backend/application-detail";
import { BackendShell } from "@/components/backend/backend-shell";
import { getViewerAccess } from "@/components/workflows/viewer-access";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { access, hasOrganization } = await getViewerAccess();
  return (
    <BackendShell title="Pedido de adoção" organization={hasOrganization}>
      <ApplicationDetail id={id} access={access} />
    </BackendShell>
  );
}
