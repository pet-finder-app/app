import { AdopterTabBar } from "@/components/adopter-tab-bar";
import {
  Badge,
  Card,
  CardDescription,
  CardTitle,
  cn,
  iconSize,
  LinkButton,
  PageShell,
  shadowSoft,
} from "@/components/ui";
import { DONATION_STATUS_LABEL, donationStatusOf } from "@/lib/donation";
import { listDonationsByDonor, listDonationTargets } from "@/lib/donations";
import { listFollowedOngIds } from "@/lib/follows";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Doar para uma ONG – Petfinder",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_TONE = {
  informada: "warning",
  confirmada: "success",
  nao_localizada: "danger",
} as const;

/** Escolher a ONG que vai receber a doação (Pix) e ver as doações já feitas. */
export default async function AdopterDonatePage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const [targets, followedIds, mine] = await Promise.all([
    listDonationTargets(),
    listFollowedOngIds(user.id),
    listDonationsByDonor(user.id),
  ]);
  const followed = new Set(followedIds);
  const ordered = [...targets].sort(
    (a, b) => Number(followed.has(b.ongId)) - Number(followed.has(a.ongId)),
  );
  const nameByOng = new Map(targets.map((t) => [t.ongId, t.name]));

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <LinkButton href="/" variant="pill" size="sm" className="self-start">
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Início
        </LinkButton>
        <CardTitle>Doar para uma ONG</CardTitle>
        <p className="text-sm text-neutral-600">
          Sua doação ajuda com ração, vacina e tratamento. O Pix vai direto para
          a conta da ONG que você escolher; o Petfinder não cobra nada.
        </p>
      </Card>

      {ordered.length === 0 ? (
        <Card className="items-center gap-2 text-center">
          <p className="text-sm text-neutral-600">
            Nenhuma ONG cadastrou ainda uma forma de receber doações.
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordered.map((target) => (
            <li key={target.ongId}>
              <Link
                href={`/adotante/doar/${target.ongId}`}
                className={cn(
                  "flex items-center gap-3 rounded-2xl bg-white p-3 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none",
                  shadowSoft.md,
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-900">
                    {target.name}
                  </p>
                  {target.city ? (
                    <p className="flex items-center gap-1 text-xs text-neutral-600">
                      <MapPin className="size-3" aria-hidden="true" />
                      {target.city}
                    </p>
                  ) : null}
                  {target.neededItems.length > 0 ? (
                    <p className="truncate text-xs text-neutral-600">
                      Também aceita: {target.neededItems.join(", ")}
                    </p>
                  ) : null}
                </div>
                {followed.has(target.ongId) ? (
                  <Badge tone="info" size="sm">
                    Você segue
                  </Badge>
                ) : null}
                <ChevronRight
                  className={cn(iconSize.md, "shrink-0 text-neutral-600")}
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {mine.length > 0 ? (
        <>
          <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
            Minhas doações
          </h2>
          <ul className="flex flex-col gap-2">
            {mine.map((donation) => {
              const status = donationStatusOf(donation);
              return (
                <li
                  key={donation.id}
                  className={cn(
                    "flex flex-col gap-1 rounded-2xl bg-white p-3",
                    shadowSoft.md,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-bold text-neutral-900">
                      {currency.format(donation.amount)} ·{" "}
                      {nameByOng.get(donation.ongId) ?? "ONG"}
                    </p>
                    <Badge tone={STATUS_TONE[status]} size="sm">
                      {DONATION_STATUS_LABEL[status]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {new Date(donation.createdAt).toLocaleString("pt-BR")}
                  </CardDescription>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      <AdopterTabBar />
    </PageShell>
  );
}
