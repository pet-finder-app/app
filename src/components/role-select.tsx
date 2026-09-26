import type { AccountRole } from "@/lib/users";
import { cn } from "./ui/cn";
import { pressSoft, shadowSoft } from "./ui/elevation";

type RoleOption = {
  role: AccountRole;
  title: string;
  description: string;
};

const OPTIONS: RoleOption[] = [
  {
    role: "adopter",
    title: "Sou adotante",
    description: "Quero encontrar um pet para adotar.",
  },
  {
    role: "ong",
    title: "Sou uma ONG",
    description: "Quero cadastrar pets para adoção.",
  },
];

type RoleSelectProps = {
  onSelect: (role: AccountRole) => void;
};

/** Primeira etapa do cadastro: escolher entre adotante e ONG. */
export function RoleSelect({ onSelect }: RoleSelectProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-neutral-900">
        Como você quer se cadastrar?
      </p>

      {OPTIONS.map((option) => (
        <button
          key={option.role}
          type="button"
          onClick={() => onSelect(option.role)}
          className={cn(
            "flex flex-col gap-0.5 rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-left transition-colors hover:bg-primary-faint focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
            shadowSoft.md,
            pressSoft.md,
          )}
        >
          <span className="text-sm font-bold text-neutral-900">
            {option.title}
          </span>
          <span className="text-xs text-neutral-500">{option.description}</span>
        </button>
      ))}
    </div>
  );
}
