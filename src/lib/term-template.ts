/** Default adoption-agreement template, overridable per NGO. Double-braced variables are populated per adoption. Each NGO should obtain legal review before production use; this module is client-safe. */

export const TERM_VARIABLES: { name: string; description: string }[] = [
  { name: "pet.name", description: "Nome do pet" },
  { name: "pet.species", description: "Espécie (cachorro, gato...)" },
  { name: "pet.breed", description: "Raça (ou sem raça definida)" },
  { name: "pet.sex", description: "Macho ou fêmea" },
  { name: "pet.age", description: "Filhote, adulto ou idoso" },
  { name: "pet.health", description: "Vacinado, castrado, vermifugado" },
  { name: "adopter.name", description: "Nome completo do adotante" },
  { name: "adopter.personalTaxId", description: "CPF do adotante" },
  { name: "adopter.address", description: "Endereço do adotante" },
  { name: "ngo.name", description: "Nome da ONG" },
  { name: "ngo.document", description: "CNPJ ou CPF da ONG" },
  {
    name: "ngo.representative",
    description: "Responsável que assina pela ONG",
  },
  { name: "city", description: "Cidade da ONG" },
  { name: "date", description: "Data em que o termo é gerado" },
];

export const DEFAULT_TERM_TEMPLATE = `TERMO DE ADOÇÃO RESPONSÁVEL

Pelo presente termo, {{ngo.name}} ({{ngo.document}}), com sede em {{city}}, representada por {{ngo.representative}}, doravante chamada ONG, entrega em adoção o animal abaixo ao ADOTANTE {{adopter.name}}, CPF {{adopter.personalTaxId}}, residente em {{adopter.address}}.

ANIMAL
Nome: {{pet.name}}
Espécie: {{pet.species}}
Raça: {{pet.breed}}
Sexo: {{pet.sex}}
Idade: {{pet.age}}
Situação de saúde na entrega: {{pet.health}}

O ADOTANTE declara que leu e concorda com as cláusulas abaixo.

1. O ADOTANTE se compromete a oferecer ao animal alimentação, água, abrigo, higiene, carinho e atendimento veterinário sempre que necessário, durante toda a vida do animal.

2. O animal não será vendido, cedido, doado, trocado, abandonado, mantido preso em corrente nem usado para reprodução ou para fins comerciais.

3. Se não puder mais ficar com o animal, o ADOTANTE avisará a ONG e o devolverá a ela, sem entregá-lo a terceiros.

4. O ADOTANTE se compromete a castrar o animal, quando a idade permitir, e a mantê-lo com vacinas e vermífugo em dia.

5. O ADOTANTE aceita o acompanhamento da ONG depois da adoção, enviando fotos e notícias do animal pelo aplicativo depois de 1 semana, 1 mês e 3 meses da entrega, e aceita visitas combinadas com antecedência.

6. Em caso de maus-tratos, abandono ou descumprimento deste termo, a ONG poderá reaver o animal.

7. O ADOTANTE declara que as informações prestadas na ficha de adoção são verdadeiras.

{{city}}, {{date}}.

Este termo é assinado eletronicamente pelas duas partes, dentro do aplicativo Petfinder.`;

/** Replace known double-braced template variables; leave unknown variables unchanged. */
export function renderTermTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

/** Return unknown template variables, which may be typing mistakes. */
export function findUnknownVariables(template: string): string[] {
  const known = new Set(TERM_VARIABLES.map((v) => v.name));
  const found = new Set<string>();
  for (const match of template.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
    if (!known.has(match[1])) found.add(match[1]);
  }
  return [...found];
}
