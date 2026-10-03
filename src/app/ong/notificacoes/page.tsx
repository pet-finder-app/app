import { OngTabBar } from "@/components/ong-tab-bar";
import { Badge, Card, CardTitle, cn, PageShell } from "@/components/ui";
import { shadowSoft } from "@/components/ui/elevation";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/notification";
import { countUnreadByOng, listNotificationsByOng } from "@/lib/notifications";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MarkAllReadButton } from "./mark-all-read-button";

export const metadata: Metadata = {
  title: "Notificações – Petfinder",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export default async function NotificationsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const [notifications, unreadCount] = await Promise.all([
    listNotificationsByOng(user.id),
    countUnreadByOng(user.id),
  ]);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Notificações</CardTitle>
          {unreadCount > 0 ? <MarkAllReadButton /> : null}
        </div>
        <p className="text-sm text-neutral-600">
          Interesses e curtidas de quem viu os pets que você publicou.
        </p>
      </Card>

      {notifications.length === 0 ? (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Ninguém interagiu com seus pets ainda.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => {
            const unread = notification.readAt === null;
            return (
              <li
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl p-3",
                  unread ? "bg-primary-faint" : "bg-white",
                  shadowSoft.md,
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-lime-800"
                >
                  {initials(notification.adopterName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-900">
                    <span className="font-bold">
                      {notification.adopterName}
                    </span>{" "}
                    {NOTIFICATION_TYPE_LABEL[notification.type]}{" "}
                    <span className="font-bold">{notification.petName}</span>
                  </p>
                  {notification.message ? (
                    <p className="mt-1 text-sm text-neutral-900 italic">
                      &ldquo;{notification.message}&rdquo;
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-neutral-600">
                    {new Date(notification.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                {unread ? <Badge tone="info">Novo</Badge> : null}
              </li>
            );
          })}
        </ul>
      )}

      <OngTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
