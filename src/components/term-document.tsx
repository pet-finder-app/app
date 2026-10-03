import type { AdoptionTerm } from "@/lib/adoption";
import { maskCpf } from "@/lib/br-documents";

const ROLE_LABEL = { ong: "ONG", adopter: "Adotante" } as const;

/** Endereço de rede de teste (local) não diz nada à pessoa: só mostra os reais. */
function isRealIp(ip: string): boolean {
  return (
    Boolean(ip) && ip !== "::1" && ip !== "127.0.0.1" && ip !== "desconhecido"
  );
}

/**
 * Termo para ler, imprimir ou salvar como PDF, mais a página de comprovação das
 * assinaturas (quem, quando, de onde, e a identificação única do documento).
 * Usado nos termos de adoção e de entrega de pet à ONG.
 */
export function TermDocument({
  term,
  roleLabel = ROLE_LABEL,
}: {
  term: AdoptionTerm;
  /** Como cada parte aparece na comprovação (ex.: "Tutor" em vez de "Adotante"). */
  roleLabel?: Record<"ong" | "adopter", string>;
}) {
  return (
    <>
      <article className="text-sm leading-relaxed whitespace-pre-line">
        {term.text}
      </article>

      <section className="break-before-page rounded-2xl border border-stone-300 p-4 text-sm">
        <h2 className="mb-1 text-base font-bold">
          Comprovação das assinaturas
        </h2>
        <p className="mb-3 text-xs text-neutral-600">
          Documento nº{" "}
          <strong>{term.textHash.slice(0, 8).toUpperCase()}</strong>, gerado em{" "}
          {new Date(term.generatedAt).toLocaleString("pt-BR")}. Esta página
          mostra quem assinou, quando e como. Se o texto do termo for alterado
          depois, as identificações digitais abaixo deixam de conferir.
        </p>
        {term.signatures.length === 0 ? (
          <p>Nenhuma assinatura ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {term.signatures.map((signature) => (
              <li key={signature.role} className="flex flex-col gap-0.5">
                <span className="font-bold">
                  {roleLabel[signature.role]}: {signature.name}
                </span>
                <span>CPF {maskCpf(signature.cpf)}</span>
                <span>
                  Assinou em{" "}
                  {new Date(signature.signedAt).toLocaleString("pt-BR")}
                </span>
                <span className="text-xs text-neutral-600">
                  Identidade confirmada por código de 6 números, enviado a quem
                  assinou
                  {isRealIp(signature.ip) ? ` · Rede: ${signature.ip}` : ""}.
                </span>
              </li>
            ))}
          </ul>
        )}
        {term.finalHash ? (
          <div className="mt-4 rounded-2xl bg-neutral-100 p-3 text-xs">
            <p className="font-bold">Selo de autenticidade</p>
            <p className="mt-1 text-neutral-600">
              Este código é como uma impressão digital do documento assinado: se
              ele mudar, o termo foi alterado.
            </p>
            <p className="mt-1 font-mono break-all">{term.finalHash}</p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-neutral-600">
            O selo de autenticidade aparece quando as duas partes assinarem.
          </p>
        )}
      </section>
    </>
  );
}
