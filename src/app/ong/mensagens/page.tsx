import { OngTabBar } from "@/components/ong-tab-bar";
import { PawIcon } from "@/components/paw-icon";
import { Card, CardTitle, PageShell } from "@/components/ui";
import { countUnreadByOng, listNotificationsByOng } from "@/lib/notifications";
import { getPetById } from "@/lib/pets";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mensagens – Petfinder",
};

/**
 * Reserva a aba de mensagens no menu antes do chat existir de verdade.
 * Quando implementarmos, essa página vira a lista de conversas por
 * adotante — ver as sugestões de fluxo combinadas com o time. Com
 * `?pet=<id>` (vindo do botão de interessados no card do pet), já mostra
 * quem demonstrou interesse real de adotar aquele pet.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const { pet: petId } = await searchParams;
  const [unreadCount, notifications, pet] = await Promise.all([
    countUnreadByOng(user.id),
    listNotificationsByOng(user.id),
    petId ? getPetById(petId) : Promise.resolve(undefined),
  ]);

  const interested = pet
    ? notifications.filter((n) => n.petId === pet.id && n.type === "interesse")
    : [];

  return (
    <PageShell hasActionBar>
      {pet ? (
        <Card as="header" className="gap-3">
          <CardTitle>Interessados em adotar {pet.name}</CardTitle>
          {interested.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {interested.map((n) => (
                <li
                  key={n.id}
                  className="rounded-2xl border border-neutral-200 p-3"
                >
                  <p className="font-bold text-neutral-900">{n.adopterName}</p>
                  {n.message ? (
                    <p className="mt-1 text-sm text-neutral-600">{n.message}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600">
              Ninguém demonstrou interesse em adotar {pet.name} ainda.
            </p>
          )}
          <p className="text-xs text-neutral-500">
            O chat ainda não existe — por enquanto, use o contato do seu perfil
            (WhatsApp, telefone ou e-mail) para responder.
          </p>
        </Card>
      ) : (
        <Card as="header" className="items-center gap-3 text-center">
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-full bg-primary-soft"
          >
            <PawIcon className="size-7 text-green-900" />
          </span>
          <CardTitle>Mensagens chegando em breve</CardTitle>
          <p className="text-sm text-neutral-600">
            Em breve você vai poder conversar por aqui com quem se interessou
            pelos seus pets. Por enquanto, use o contato combinado no seu perfil
            (WhatsApp, telefone ou e-mail).
          </p>
        </Card>
      )}

      <OngTabBar unreadCount={unreadCount} />
    </PageShell>
  );
}
