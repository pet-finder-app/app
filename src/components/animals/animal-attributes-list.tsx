import { parseAnimalAttributes } from "@/lib/api/animals";
import type { Animal } from "@/lib/backend/contracts";
import { ENERGY_LABELS, SIZE_LABELS, speciesLabel } from "./animal-labels";

const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});
const yesNo = (value: boolean | null | undefined, yes: string, no: string) =>
  value === true ? yes : value === false ? no : "Não informado";

type AnimalAttributesListProps = { animal: Animal };

/** Public description of the structured attributes Go stores for an animal. */
export function AnimalAttributesList({ animal }: AnimalAttributesListProps) {
  const attributes = parseAnimalAttributes(animal.attributes);
  const rows: { label: string; value: string }[] = [
    { label: "Espécie", value: speciesLabel(animal.species) },
    { label: "Porte", value: SIZE_LABELS[animal.size] ?? "Não informado" },
    {
      label: "Vacinação",
      value: yesNo(
        attributes?.vaccinated ?? animal.vaccinated,
        "Vacinado",
        "Não vacinado",
      ),
    },
    {
      label: "Castração",
      value: yesNo(
        attributes?.neutered ?? animal.neutered,
        "Castrado",
        "Não castrado",
      ),
    },
  ];
  if (animal.breed) rows.push({ label: "Raça", value: animal.breed });
  if (attributes?.heightCm)
    rows.push({
      label: "Altura",
      value: `${numberFormat.format(attributes.heightCm)} cm`,
    });
  if (attributes?.weightKg)
    rows.push({
      label: "Peso",
      value: `${numberFormat.format(attributes.weightKg)} kg`,
    });
  if (attributes?.energyLevel)
    rows.push({
      label: "Energia",
      value: ENERGY_LABELS[attributes.energyLevel],
    });
  if (attributes?.specialNeeds ?? animal.specialNeeds)
    rows.push({ label: "Necessidades especiais", value: "Sim" });
  if (attributes?.temperament?.length)
    rows.push({
      label: "Temperamento",
      value: attributes.temperament.join(", "),
    });
  if (attributes?.medicalConditions?.length)
    rows.push({
      label: "Condições médicas",
      value: attributes.medicalConditions.join(", "),
    });
  return (
    <dl className="grid grid-cols-2 gap-2">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="font-medium">{row.label}</dt>
          <dd className="break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
