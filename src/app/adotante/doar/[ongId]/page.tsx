import { AdopterTabBar } from "@/components/adopter-tab-bar";
import { DonationForm } from "@/components/donation-form";
import {
  Card,
  CardTitle,
  iconSize,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { getDonationTarget } from "@/lib/donations";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Doar – Petfinder",
};

export default async function AdopterDonateToOngPage({
  params,
}: {
  params: Promise<{ ongId: string }>;
}) {
  const { ongId } = await params;
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "adopter" || !user.adopter) redirect("/");

  const target = await getDonationTarget(ongId);
  if (!target) notFound();
  const canReceive = Boolean(target.pixKey || target.bankAccount);

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <LinkButton
          href="/adotante/doar"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Doações
        </LinkButton>
        <h1 className="text-xl font-bold text-neutral-900">
          Doar para {target.name}
        </h1>
        {target.city ? (
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <MapPin className="size-4" aria-hidden="true" />
            {target.city}
          </p>
        ) : null}
        {target.neededItems.length > 0 ? (
          <p className="text-sm text-neutral-900">
            Além de dinheiro, a ONG aceita:{" "}
            <strong>{target.neededItems.join(", ")}</strong>.
          </p>
        ) : null}
      </Card>

      {canReceive ? (
        <DonationForm target={target} />
      ) : (
        <Card className="gap-1">
          <CardTitle>Ainda sem Pix cadastrado</CardTitle>
          <p className="text-sm text-neutral-600">
            {target.name} ainda não informou como receber doações em dinheiro.
            Que tal seguir a ONG e voltar mais tarde?
          </p>
        </Card>
      )}

      <AdopterTabBar />
    </PageShell>
  );
}
