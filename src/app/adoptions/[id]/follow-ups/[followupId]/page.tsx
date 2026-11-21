import { BackendShell } from "@/components/backend/backend-shell";
import { FollowupDetail } from "@/components/workflows/followup-detail";
import { getViewerAccess } from "@/components/workflows/viewer-access";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; followupId: string }>;
}) {
  const { id, followupId } = await params;
  const { access, hasOrganization } = await getViewerAccess();
  return (
    <BackendShell
      title="Acompanhamento pós-adoção"
      organization={hasOrganization}
    >
      <FollowupDetail
        applicationId={id}
        followupId={followupId}
        access={access}
      />
    </BackendShell>
  );
}
