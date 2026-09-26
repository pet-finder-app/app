import { Badge, iconSize, type BadgeTone } from "@/components/ui";
import { VERIFICATION_STATUS_LABEL, type VerificationStatus } from "@/lib/ong";
import { Check } from "lucide-react";

const TONE: Record<VerificationStatus, BadgeTone> = {
  pendente: "warning",
  em_analise: "info",
  verificada: "success",
  suspensa: "danger",
};

/** Selo de status da ONG — aparece no perfil e no painel. */
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <Badge tone={TONE[status]}>
      {status === "verificada" ? (
        <Check className={iconSize.sm} aria-hidden="true" />
      ) : null}
      {VERIFICATION_STATUS_LABEL[status]}
    </Badge>
  );
}
