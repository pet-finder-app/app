import { Progress } from "@/components/ui";
import { BrutalLinkButton } from "@/components/ui/brutal-button";
import { BrutalCard } from "@/components/ui/brutal-card";
import { getNgoChecklist, type NgoProfile } from "@/lib/ngo";

/** Unverified-NGO checklist explaining the remaining publication requirements. */
export function NgoVerificationChecklistCard({
  ngo,
  blockedAction,
}: {
  ngo: NgoProfile;
  /** Explain why a requested action is currently blocked. */
  blockedAction?: string;
}) {
  const checklist = getNgoChecklist(ngo);
  const done = checklist.filter((item) => item.done).length;
  const status = ngo.verification.status;

  return (
    <BrutalCard className="gap-3">
      <div>
        <p className="text-sm font-bold text-neutral-900">
          {blockedAction
            ? status === "under_review"
              ? `Para ${blockedAction}, aguarde a aprovação`
              : `Para ${blockedAction}, complete o cadastro primeiro`
            : status === "under_review"
              ? "Cadastro em análise"
              : "Complete o cadastro para publicar pets"}
        </p>
        <p className="text-sm text-neutral-600">
          {status === "under_review"
            ? "Nossa equipe está conferindo seus documentos e avisa por e-mail quando terminar. Depois disso você poderá cadastrar pets e fazer posts."
            : "São 2 passos: 1) preencher os itens abaixo e enviar; 2) nossa equipe confere e aprova. Só depois você pode cadastrar pets e fazer posts."}
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

      <BrutalLinkButton href="/ngo/settings" size="lg">
        {status === "pending" ? "COMPLETAR CADASTRO" : "VER MEU CADASTRO"}
      </BrutalLinkButton>
    </BrutalCard>
  );
}
