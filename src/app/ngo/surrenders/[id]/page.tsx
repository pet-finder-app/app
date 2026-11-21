import { BackendShell } from "@/components/backend/backend-shell";
import { SurrenderDetail } from "@/components/workflows/surrender-detail";
import { getViewerAccess } from "@/components/workflows/viewer-access";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { access } = await getViewerAccess();
  return (
    <BackendShell title="Entrega ou devolução" organization>
      <SurrenderDetail surrenderId={id} access={access} />
    </BackendShell>
  );
}
