import { BackendShell } from "@/components/backend/backend-shell";
import { ConversationList } from "@/components/backend/conversation-list";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Conversas">
      <ConversationList />
    </BackendShell>
  );
}
