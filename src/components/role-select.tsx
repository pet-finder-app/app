import type { AccountRole } from "@/lib/users";

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
      <p className="text-sm font-semibold text-white">
        Como você quer se cadastrar?
      </p>

      {OPTIONS.map((option) => (
        <button
          key={option.role}
          type="button"
          onClick={() => onSelect(option.role)}
          className="flex flex-col gap-0.5 rounded-lg bg-white px-4 py-3.5 text-left transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
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
