import { AdopterTabBar } from "@/components/adopter-tab-bar";
import {
  Badge,
  Card,
  CardTitle,
  cn,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { shadowSoft } from "@/components/ui/elevation";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/notification";
import { listNotificationsByAdopter } from "@/lib/notifications";
import {
  isSurrenderActive,
  SURRENDER_STATUS_LABEL,
  whoActsNow,
} from "@/lib/surrender";
import { listSurrendersByAdopter } from "@/lib/surrenders";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Minha atividade – Petfinder",
};

export default async function AdopterNotificationsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const [notifications, surrenders] = await Promise.all([
    listNotificationsByAdopter(user.id),
    listSurrendersByAdopter(user.id),
  ]);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <CardTitle>Minha atividade</CardTitle>
        <p className="text-sm text-neutral-600">
          O que você já fez: pets favoritados e pedidos de adoção enviados. As
          respostas das ONGs chegam pelo telefone ou e-mail do seu perfil.
        </p>
      </Card>

      <Card className="gap-3">
        <CardTitle>Doações e entregas de pets</CardTitle>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/adotante/doar" variant="outline" size="sm">
            Doar para uma ONG
          </LinkButton>
          <LinkButton
            href="/adotante/acolhimentos/novo"
            variant="outline"
            size="sm"
          >
            Deixar um pet com a ONG
          </LinkButton>
        </div>
        {surrenders.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {surrenders.map((surrender) => (
              <li key={surrender.id}>
                <Link
                  href={`/adotante/acolhimentos/${surrender.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-stone-300 p-3 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-neutral-900">
                      {surrender.adoptionId ? "Devolução" : "Entrega"} de{" "}
                      {surrender.pet.name}
                    </p>
                    <p className="truncate text-xs text-neutral-600">
                      {surrender.ongName} ·{" "}
                      {SURRENDER_STATUS_LABEL[surrender.status]}
                    </p>
                  </div>
                  {isSurrenderActive(surrender.status) &&
                  whoActsNow(surrender) === "adopter" ? (
                    <Badge tone="warning">Sua vez</Badge>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
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
