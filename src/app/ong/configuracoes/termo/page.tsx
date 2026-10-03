import { OngTabBar } from "@/components/ong-tab-bar";
import { TermTemplateForm } from "@/components/term-template-form";
import { iconSize, LinkButton, PageShell } from "@/components/ui";
import { getTermTemplate } from "@/lib/term-templates";
import { findUserById, SESSION_COOKIE } from "@/lib/users";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Termo de adoção – Petfinder",
};

export default async function OngTermPage() {
  const session = (await cookies()).get(SESSION_COOKIE);
  const user = session ? await findUserById(session.value) : undefined;

  if (!user) redirect("/login");
  if (user.role !== "ong" || !user.ong) redirect("/");

  const template = await getTermTemplate(user.id);

  return (
    <PageShell hasActionBar>
      <LinkButton
        href="/ong/adocoes"
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
      <OngTabBar />
    </PageShell>
  );
}
