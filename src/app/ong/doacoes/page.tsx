import { DonationConfirmList } from "@/components/donation-confirm-list";
import { OngTabBar } from "@/components/ong-tab-bar";
import {
  Card,
  CardTitle,
  iconSize,
  LinkButton,
  PageShell,
} from "@/components/ui";
import { donationStatusOf } from "@/lib/donation";
import { listDonationsByOng } from "@/lib/donations";
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

/** Doações em dinheiro: o que falta conferir no extrato e o histórico. */
export default async function OngDonationsPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const donations = await listDonationsByOng(user.id);
  const pending = donations.filter((d) => donationStatusOf(d) === "informada");
  const rest = donations.filter((d) => donationStatusOf(d) !== "informada");
  const total = donations
    .filter((d) => donationStatusOf(d) === "confirmada")
    .reduce((sum, d) => sum + d.amount, 0);
  const hasPix = Boolean(
    user.ong.publicProfile.donation.pixKey.trim() ||
    user.ong.publicProfile.donation.bankAccount.trim(),
  );

  return (
    <PageShell hasActionBar>
      <Card as="header" className="gap-2">
        <LinkButton
          href="/ong/dashboard"
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
              href="/ong/configuracoes"
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

      <OngTabBar />
    </PageShell>
  );
}
