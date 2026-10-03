/**
 * Modelo do termo de adoção. Cada ONG pode escrever o seu; se não escreveu,
 * vale o modelo padrão abaixo. As variáveis entre chaves duplas são
 * preenchidas pelo app na hora de gerar o termo de cada adoção.
 *
 * ATENÇÃO: o modelo padrão é um ponto de partida, não um parecer jurídico.
 * Cada ONG deve revisá-lo (de preferência com um advogado) antes de usar.
 *
 * Este arquivo não importa nada do Node: pode ser usado no client.
 */

export const TERM_VARIABLES: { name: string; description: string }[] = [
  { name: "pet.nome", description: "Nome do pet" },
  { name: "pet.especie", description: "Espécie (cachorro, gato...)" },
  { name: "pet.raca", description: "Raça (ou sem raça definida)" },
  { name: "pet.sexo", description: "Macho ou fêmea" },
  { name: "pet.idade", description: "Filhote, adulto ou idoso" },
  { name: "pet.saude", description: "Vacinado, castrado, vermifugado" },
  { name: "adotante.nome", description: "Nome completo do adotante" },
  { name: "adotante.cpf", description: "CPF do adotante" },
  { name: "adotante.endereco", description: "Endereço do adotante" },
  { name: "ong.nome", description: "Nome da ONG" },
  { name: "ong.documento", description: "CNPJ ou CPF da ONG" },
  { name: "ong.responsavel", description: "Responsável que assina pela ONG" },
  { name: "cidade", description: "Cidade da ONG" },
  { name: "data", description: "Data em que o termo é gerado" },
];

export const DEFAULT_TERM_TEMPLATE = `TERMO DE ADOÇÃO RESPONSÁVEL

Pelo presente termo, {{ong.nome}} ({{ong.documento}}), com sede em {{cidade}}, representada por {{ong.responsavel}}, doravante chamada ONG, entrega em adoção o animal abaixo ao ADOTANTE {{adotante.nome}}, CPF {{adotante.cpf}}, residente em {{adotante.endereco}}.

ANIMAL
Nome: {{pet.nome}}
Espécie: {{pet.especie}}
Raça: {{pet.raca}}
Sexo: {{pet.sexo}}
Idade: {{pet.idade}}
Situação de saúde na entrega: {{pet.saude}}

O ADOTANTE declara que leu e concorda com as cláusulas abaixo.

1. O ADOTANTE se compromete a oferecer ao animal alimentação, água, abrigo, higiene, carinho e atendimento veterinário sempre que necessário, durante toda a vida do animal.

2. O animal não será vendido, cedido, doado, trocado, abandonado, mantido preso em corrente nem usado para reprodução ou para fins comerciais.

3. Se não puder mais ficar com o animal, o ADOTANTE avisará a ONG e o devolverá a ela, sem entregá-lo a terceiros.

4. O ADOTANTE se compromete a castrar o animal, quando a idade permitir, e a mantê-lo com vacinas e vermífugo em dia.

5. O ADOTANTE aceita o acompanhamento da ONG depois da adoção, enviando fotos e notícias do animal pelo aplicativo depois de 1 semana, 1 mês e 3 meses da entrega, e aceita visitas combinadas com antecedência.

6. Em caso de maus-tratos, abandono ou descumprimento deste termo, a ONG poderá reaver o animal.

7. O ADOTANTE declara que as informações prestadas na ficha de adoção são verdadeiras.

{{cidade}}, {{data}}.

Este termo é assinado eletronicamente pelas duas partes, dentro do aplicativo Petfinder.`;

/** Troca cada {{variável}} do modelo pelo valor; variável desconhecida fica como está. */
export function renderTermTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

/** Variáveis do modelo que o app não conhece (provável erro de digitação). */
export function findUnknownVariables(template: string): string[] {
  const known = new Set(TERM_VARIABLES.map((v) => v.name));
  const found = new Set<string>();
  for (const match of template.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
    if (!known.has(match[1])) found.add(match[1]);
  }
  return [...found];
}
