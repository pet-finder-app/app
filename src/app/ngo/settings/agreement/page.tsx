import { NgoTabBar } from "@/components/ngo/ngo-tab-bar";
import { iconSize, LinkButton, PageShell } from "@/components/ui";
import { getTermTemplate } from "@/lib/term-templates";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TermTemplateForm } from "./_components/term-template-form";

export const metadata: Metadata = {
  title: "Termo de adoção – Petfinder",
};

export default async function NgoTermPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ngo" || !user.ngo) redirect("/");

  const template = await getTermTemplate(user.id);

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/ngo/adoptions"
        variant="pill"
        size="sm"
        className="self-start"
      >
        <ChevronLeft className={iconSize.sm} aria-hidden="true" />
        Adoções
      </LinkButton>
      <TermTemplateForm
        initialBody={template.body}
        isCustom={template.isCustom}
      />
      <NgoTabBar />
    </PageShell>
  );
}
