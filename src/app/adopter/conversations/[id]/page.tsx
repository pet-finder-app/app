import { BackendShell } from "@/components/backend/backend-shell";
import { ChatThread } from "@/components/backend/chat-thread";
import { getCurrentUser } from "@/lib/backend/server";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  return (
    <BackendShell title="Conversa mediada" hasNavigation={false}>
      <ChatThread id={id} userId={user.id} />
    </BackendShell>
  );
}
