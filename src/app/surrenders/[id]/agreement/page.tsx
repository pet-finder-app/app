import { BackendShell } from "@/components/backend/backend-shell";
import { SurrenderAgreement } from "@/components/workflows/surrender-agreement";
import { getViewerAccess } from "@/components/workflows/viewer-access";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { access, hasOrganization } = await getViewerAccess();
  return (
    <BackendShell title="Termo de entrega" organization={hasOrganization}>
      <SurrenderAgreement surrenderId={id} access={access} />
    </BackendShell>
  );
}
