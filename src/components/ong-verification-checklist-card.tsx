import { BrutalLinkButton } from "@/components/brutal-button";
import { BrutalCard } from "@/components/brutal-card";
import { Progress } from "@/components/ui";
import { getOngChecklist, type OngProfile } from "@/lib/ong";

/**
 * Card exibido enquanto a ONG não está verificada — explica o motivo e
 * mostra o checklist do que falta para publicar o primeiro pet. Usado no
 * Perfil (`/`) e na tela de Pets (`/ong/pets`).
 */
export function OngVerificationChecklistCard({ ong }: { ong: OngProfile }) {
  const checklist = getOngChecklist(ong);
  const done = checklist.filter((item) => item.done).length;
  const status = ong.verification.status;

  return (
    <BrutalCard className="gap-3">
      <div>
        <p className="text-sm font-bold text-neutral-900">
          {status === "em_analise"
            ? "Cadastro em análise"
            : "Complete o cadastro para publicar pets"}
        </p>
        <p className="text-sm text-neutral-600">
          {status === "em_analise"
            ? "Estamos conferindo seus documentos. Avisamos por e-mail quando terminar."
            : "Os documentos só são exigidos na hora de publicar o primeiro pet."}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
          <span>Checklist</span>
          <span>
            {done}/{checklist.length}
          </span>
        </div>
        <Progress
          value={done}
          max={checklist.length}
          label="Itens do cadastro concluídos"
        />
      </div>

      <BrutalLinkButton href="/ong/perfil/editar" size="lg">
        {status === "pendente" ? "COMPLETAR CADASTRO" : "VER PERFIL DA ONG"}
      </BrutalLinkButton>
    </BrutalCard>
  );
}
