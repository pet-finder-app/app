import { cn } from "@/components/ui/cn";
import { pressSoft, shadowSoft } from "@/components/ui/elevation";
import type { AccountRole } from "@/lib/session";
import { HouseHeart, UserRound, type LucideIcon } from "lucide-react";
import styles from "./role-select.module.css";

type RoleOption = {
  role: AccountRole;
  title: string;
  description: string;
  icon: LucideIcon;
};

const OPTIONS: RoleOption[] = [
  {
    role: "adopter",
    title: "Pessoa física",
    description: "Adote ou encaminhe um animal a uma ONG com a mesma conta.",
    icon: UserRound,
  },
  {
    role: "ngo",
    title: "ONG",
    description:
      "Cadastre sua organização para coordenar adoções após a verificação.",
    icon: HouseHeart,
  },
];

type RoleSelectProps = {
  onSelect: (role: AccountRole) => void;
  disabled?: boolean;
  headingId?: string;
};

/** Select personal or NGO registration. */
export function RoleSelect({
  onSelect,
  disabled = false,
  headingId = "auth-heading",
}: RoleSelectProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        id={headingId}
        className="mb-2 text-center text-xl font-bold text-text-light"
      >
        Como você quer se cadastrar?
      </h2>

      {OPTIONS.map((option) => (
        <button
          key={option.role}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option.role)}
          className={cn(styles.card, shadowSoft.md, pressSoft.md)}
        >
          <span className={styles.header}>
            <option.icon
              className={styles.icon}
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className={styles.title}>{option.title}</span>
          </span>
          <span className={styles.description}>{option.description}</span>
        </button>
      ))}
    </div>
  );
}
