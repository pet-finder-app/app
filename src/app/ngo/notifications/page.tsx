import { BackendShell } from "@/components/backend/backend-shell";
import { NotificationList } from "@/components/community/notification-list";
import { getCurrentUser } from "@/lib/backend/server";

export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Notificações" organization>
      <NotificationList />
    </BackendShell>
  );
}
