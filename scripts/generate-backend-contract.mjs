import { readFile, writeFile } from "node:fs/promises";
import { parse } from "yaml";
import { z } from "zod";

/** @typedef {{ $ref?: string, type?: string | string[], enum?: (string | number | boolean | null)[], properties?: Record<string, OpenApiSchema>, required?: string[], items?: OpenApiSchema }} OpenApiSchema */
/** @type {import("zod").ZodType<OpenApiSchema>} */
const schemaDefinition = z.lazy(() =>
  z.object({
    $ref: z.string().optional(),
    type: z.union([z.string(), z.array(z.string())]).optional(),
    enum: z
      .array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .optional(),
    properties: z.record(z.string(), schemaDefinition).optional(),
    required: z.array(z.string()).optional(),
    items: schemaDefinition.optional(),
  }),
);
const contractSchema = z.object({
  components: z.object({ schemas: z.record(z.string(), schemaDefinition) }),
  paths: z.record(z.string(), z.record(z.string(), z.unknown())),
});

const filename = process.argv[2] ?? "../api/build/openapi.yaml";
/** @type {unknown} */
const input = parse(await readFile(filename, "utf8"));
const contract = contractSchema.parse(input);
const definitions = contract.components.schemas;
/** @type {Set<string>} */
const completed = new Set();
const lines = [
  "// Generated from the Go backend OpenAPI contract. Run pnpm api:generate.",
  'import { z } from "zod";',
  "",
];
/** @param {string} value */
const camel = (value) =>
  value.replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
/** @param {string} value */
function name(value) {
  return value.charAt(0).toLowerCase() + value.slice(1) + "Schema";
}
/** @param {string} value
 * @returns {string} */
function reference(value) {
  const type = value.split("/").at(-1);
  if (!type || !definitions[type])
    throw new Error(`Missing backend schema: ${type}`);
  if (completed.has(type)) return name(type);
  completed.add(type);
  const expression = schema(definitions[type], type);
  lines.push(
    `export const ${name(type)} = ${expression};`,
    `export type ${type} = z.output<typeof ${name(type)}>;`,
    "",
  );
  return name(type);
}
/** @param {OpenApiSchema} value
 * @param {string} property
 * @returns {string} */
function schema(value, property = "") {
  if (value.$ref) return reference(value.$ref);
  const types = Array.isArray(value.type) ? value.type : [value.type];
  const nullable = types.includes("null");
  let result;
  if (value.enum) {
    const literals = value.enum.map(
      (item) => `z.literal(${JSON.stringify(item)})`,
    );
    result = value.enum.every((item) => typeof item === "string")
      ? `z.enum(${JSON.stringify(value.enum)})`
      : literals.length === 1
        ? literals[0]
        : `z.union([${literals.join(",")}])`;
  } else if (types.includes("object")) {
    const properties = value.properties ?? {};
    const keys = Object.keys(properties);
    if (keys.length) {
      result = `z.object({${keys.map((key) => `${JSON.stringify(key)}: ${schema(properties[key], key)}${(value.required ?? []).includes(key) ? "" : ".optional()"}`).join(",")}})`;
      if (keys.some((key) => key !== camel(key)))
        result += `.transform((value) => ({${keys.map((key) => `${JSON.stringify(camel(key))}: value[${JSON.stringify(key)}]`).join(",")}}))`;
    } else result = "z.record(z.string(), z.unknown())";
  } else if (types.includes("array")) {
    // Go may encode empty SQL result slices as null; this still means an empty collection.
    if (!value.items) throw new Error(`Missing array items: ${property}`);
    return `z.array(${schema(value.items)}).nullish().transform((value) => value ?? [])`;
  } else if (types.includes("string")) result = "z.string()";
  else if (types.includes("number") || types.includes("integer"))
    result = "z.number()";
  else if (types.includes("boolean")) result = "z.boolean()";
  else result = "z.unknown()";
  if (nullable && property !== "id") result += ".nullable()";
  // The Go pointer location response is nullable on a newly registered account.
  if (property === "LocationResponse") result += ".nullable()";
  return result;
}
for (const type of [
  "UserResponse",
  "AuthSessionResponse",
  "OrganizationResponse",
  "CollectionResponseOrganizationResponse",
  "Animal",
  "AnimalDetailResponse",
  "AnimalImageResponse",
  "CollectionResponseListAvailableAnimalsRow",
  "CollectionResponseListPreferredAnimalsRow",
  "AnimalPreference",
  "CollectionResponseListAdopterApplicationsRow",
  "CollectionResponseListOrganizationApplicationsRow",
  "ApplicationCreatedResponse",
  "ApplicationDetailResponse",
  "AdoptionApplication",
  "ApplicationScreening",
  "CollectionResponseListUserConversationsRow",
  "CollectionResponseListOrganizationConversationsRow",
  "CollectionResponseMessage",
  "MessageResponse",
  "Appointment",
  "IssuedOTPResponse",
  "AppointmentConfirmation",
  "Report",
  "CollectionResponseListOpenReportsRow",
  "MemberListResponse",
  "OrganizationMember",
]) {
  if (!definitions[type]) throw new Error(`Missing backend schema: ${type}`);
  reference(type);
}
await writeFile("src/lib/backend/contracts.ts", lines.join("\n") + "\n");
/** @type {{method: string, path: string}[]} */
const routes = [];
for (const [path, operations] of Object.entries(contract.paths)) {
  if (!path.startsWith("/v1/") || path.startsWith("/v1/auth/")) continue;
  for (const method of Object.keys(operations)) {
    if (
      !["get", "post", "put", "patch", "delete"].includes(method) ||
      path.endsWith("/ws")
    )
      continue;
    routes.push({ method: method.toUpperCase(), path });
  }
}
await writeFile(
  "src/lib/backend/routes.ts",
  `// Generated from the Go backend OpenAPI contract. Run pnpm api:generate.\nexport const BACKEND_ROUTES = ${JSON.stringify(routes, null, 2)} as const;\n`,
);
