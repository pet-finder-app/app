import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { Card, CardTitle, cn, PageShell } from "@/components/ui";
import { shadowSoft } from "@/components/ui/elevation";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/notification";
import { listNotificationsByAdopter } from "@/lib/notifications";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Notificações – Petfinder",
};

export default async function AdopterNotificationsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const notifications = await listNotificationsByAdopter(user.id);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <CardTitle>Suas interações</CardTitle>
        <p className="text-sm text-neutral-600">
          Pets que você curtiu ou em que demonstrou interesse de adotar.
        </p>
      </Card>

      {notifications.length === 0 ? (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Você ainda não curtiu nem demonstrou interesse em nenhum pet.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={cn(
                "flex flex-col gap-1 rounded-2xl bg-white p-3",
                shadowSoft.md,
              )}
            >
              <p className="text-sm text-neutral-900">
                Você {NOTIFICATION_TYPE_LABEL[notification.type]}{" "}
                <span className="font-bold">{notification.petName}</span>
              </p>
              {notification.message ? (
                <p className="text-sm text-neutral-900 italic">
                  &ldquo;{notification.message}&rdquo;
                </p>
              ) : null}
              <p className="text-xs text-neutral-600">
                {new Date(notification.createdAt).toLocaleString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <AdopterTabBar />
    </PageShell>
  );
}
