import { BackendShell } from "@/components/backend/backend-shell";
import { ConversationList } from "@/components/backend/conversation-list";
import { OrganizationSelection } from "@/components/backend/organization-selection";
import { getCurrentOrganization, getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  const organization = await getCurrentOrganization();
  return (
    <BackendShell title="Conversas" organization isTitleHidden isFullBleed>
      {organization ? (
        <ConversationList organizationId={organization.id} />
      ) : (
        <div className="px-4 pt-6">
          <OrganizationSelection />
        </div>
      )}
    </BackendShell>
  );
}
