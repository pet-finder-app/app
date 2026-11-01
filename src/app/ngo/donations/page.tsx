import { DonationConfirmList } from "@/components/donations/donation-confirm-list";
import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import {
  Card,
  CardTitle,
  iconSize,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { donationStatusOf } from "@/lib/donation";
import { listDonationsByNgo } from "@/lib/donations";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Doações – Petfinder",
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Reported monetary donations awaiting confirmation and donation history. */
export default async function NgoDonationsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const donations = await listDonationsByNgo(user.id);
  const pending = donations.filter((d) => donationStatusOf(d) === "reported");
  const rest = donations.filter((d) => donationStatusOf(d) !== "reported");
  const total = donations
    .filter((d) => donationStatusOf(d) === "confirmed")
    .reduce((sum, d) => sum + d.amount, 0);
  const hasPix = Boolean(
    user.ngo.publicProfile.donation.pixKey.trim() ||
    user.ngo.publicProfile.donation.bankAccount.trim(),
  );

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <LinkButton
          href="/ngo/dashboard"
          variant="pill"
          size="sm"
          className="self-start"
        >
          <ChevronLeft className={iconSize.sm} aria-hidden="true" />
          Início
        </LinkButton>
        <CardTitle>Doações</CardTitle>
        <p className="text-sm text-neutral-600">
          Quando alguém doa por Pix, avisa aqui. Confira no extrato do banco e
          toque em &ldquo;Recebi o Pix&rdquo;: só as confirmadas entram no total
          ({currency.format(total)}).
        </p>
        {!hasPix ? (
          <p className="text-sm text-neutral-900">
            Você ainda não cadastrou sua chave Pix, então ninguém consegue doar.{" "}
            <LinkButton
              href="/ngo/settings"
              variant="pill"
              size="sm"
              className="ml-1"
            >
              Cadastrar agora
            </LinkButton>
          </p>
        ) : null}
      </Card>

      {pending.length > 0 ? (
        <>
          <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
            Para conferir ({pending.length})
          </h2>
          <DonationConfirmList donations={pending} />
        </>
      ) : null}

      <h2 className="text-xs font-bold tracking-wide text-neutral-600 uppercase">
        Histórico
      </h2>
      <DonationConfirmList donations={rest} />

      <NgoTabBar />
    </PageShell>
  );
}
