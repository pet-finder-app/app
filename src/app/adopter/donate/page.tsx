import { BackendShell } from "@/components/backend/backend-shell";
import { DonationDisclaimer } from "@/components/donations/donation-disclaimer";
import { DonationList } from "@/components/donations/donation-list";
import { DonationOrganizationList } from "@/components/donations/donation-organization-list";
import { getCurrentUser } from "@/lib/backend/server";

export default async function Page() {
  await getCurrentUser();
  return (
    <BackendShell title="Doar para uma ONG">
      <DonationDisclaimer />
      <DonationOrganizationList />
      <section aria-labelledby="my-donations" className="flex flex-col gap-3">
        <h2 id="my-donations" className="text-lg font-bold">
          Minhas doações
        </h2>
        <DonationList />
      </section>
    </BackendShell>
  );
}
