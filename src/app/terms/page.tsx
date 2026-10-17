import { PageShell } from "@/components/ui";
import { TERMS_VERSION } from "@/lib/ngo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de uso – Petfinder",
};

/* DRAFT: placeholder legal content pending review. Update TERMS_VERSION whenever this text changes so acceptance records identify the version shown. */

const SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. Objeto",
    paragraphs: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. O Petfinder é uma plataforma que conecta organizações de proteção animal a pessoas interessadas em adotar. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    ],
  },
  {
    title: "2. Cadastro e responsabilidades da ONG",
    paragraphs: [
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. A organização declara que as informações prestadas são verdadeiras e que possui autorização para representar a entidade cadastrada.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. A publicação de animais para adoção depende da conclusão da verificação cadastral.",
    ],
  },
  {
    title: "3. Proteção de dados (LGPD)",
    paragraphs: [
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Os dados dos adotantes recebidos por meio da plataforma devem ser tratados exclusivamente para a finalidade de adoção, nos termos da Lei nº 13.709/2018.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    ],
  },
  {
    title: "4. Suspensão e encerramento",
    paragraphs: [
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. O Petfinder pode suspender cadastros que violem estes termos ou a legislação de proteção animal.",
    ],
  },
  {
    title: "5. Política de privacidade",
    paragraphs: [
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Registramos data, hora e endereço IP do aceite destes termos para fins de comprovação.",
    ],
  },
];

export default function TermsPage() {
  return (
    <PageShell width="lg">
      <article className="mx-auto flex w-full max-w-[80ch] flex-col gap-6 text-sm">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
            Rascunho · versão {TERMS_VERSION}
          </p>
          <h1 className="text-2xl font-bold text-neutral-900">
            Termos de uso e política de privacidade
          </h1>
          <p className="text-sm text-neutral-600">
            Este texto é provisório e será substituído pela versão revisada pelo
            jurídico.
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-neutral-900">
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed text-neutral-900"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </PageShell>
  );
}
