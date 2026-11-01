import { Card, LinkButton, PageShell } from "@/components/ui";

export default function TermsPage() {
  const terms = process.env.NEXT_PUBLIC_TERMS_URL;
  const privacy = process.env.NEXT_PUBLIC_PRIVACY_URL;
  return (
    <PageShell>
      <Card>
        <h1 className="text-xl font-bold">
          Termos de uso e política de privacidade
        </h1>
        {terms ? (
          <a className="font-bold underline" href={terms}>
            Ler os termos de uso
          </a>
        ) : (
          <p>Os termos de uso oficiais ainda não foram disponibilizados.</p>
        )}
        {privacy ? (
          <a className="font-bold underline" href={privacy}>
            Ler a política de privacidade
          </a>
        ) : (
          <p>
            A política de privacidade oficial ainda não foi disponibilizada.
          </p>
        )}
        <LinkButton href="/register" variant="outline">
          Voltar ao cadastro
        </LinkButton>
      </Card>
    </PageShell>
  );
}
