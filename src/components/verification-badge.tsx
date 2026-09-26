import {
  Badge,
  iconSize,
  type BadgeSize,
  type BadgeTone,
} from "@/components/ui";
import { VERIFICATION_STATUS_LABEL, type VerificationStatus } from "@/lib/ong";
import { Check } from "lucide-react";

const TONE: Record<VerificationStatus, BadgeTone> = {
  pendente: "warning",
  em_analise: "info",
  verificada: "success",
  suspensa: "danger",
};

/**
 * Selo de status — aparece no perfil e no painel. `label` sobrescreve o
 * texto padrão (ONG); o adotante usa `ADOPTER_VERIFICATION_STATUS_LABEL` de
 * `lib/adopter.ts`, já que o vocabulário de status é o mesmo dos dois lados.
 */
export function VerificationBadge({
  status,
  label,
  size = "md",
}: {
  status: VerificationStatus;
  label?: string;
  size?: BadgeSize;
}) {
  return (
    <Badge tone={TONE[status]} size={size}>
      {status === "verificada" ? (
        <Check className={iconSize.sm} aria-hidden="true" />
      ) : null}
      {label ?? VERIFICATION_STATUS_LABEL[status]}
    </Badge>
  );
}
