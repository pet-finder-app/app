import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_TERM_TEMPLATE } from "./term-template";

/**
 * Modelo de termo de cada ONG — hoje um arquivo JSON, amanhã o backend.
 * Quem não escreveu o seu usa `DEFAULT_TERM_TEMPLATE`.
 */

type StoredTemplate = { ongId: string; body: string; updatedAt: string };

const FILE = path.join(process.cwd(), "src", "data", "term-templates.json");

async function read(): Promise<StoredTemplate[]> {
  const raw = await fs.readFile(FILE, "utf-8");
  return (JSON.parse(raw) as { templates: StoredTemplate[] }).templates;
}

export async function getTermTemplate(
  ongId: string,
): Promise<{ body: string; isCustom: boolean }> {
  const found = (await read()).find((t) => t.ongId === ongId);
  return found
    ? { body: found.body, isCustom: true }
    : { body: DEFAULT_TERM_TEMPLATE, isCustom: false };
}

/** Salva o modelo da ONG. Corpo vazio volta ao modelo padrão. */
export async function saveTermTemplate(
  ongId: string,
  body: string,
): Promise<void> {
  const others = (await read()).filter((t) => t.ongId !== ongId);
  const next = body.trim()
    ? [...others, { ongId, body, updatedAt: new Date().toISOString() }]
    : others;
  await fs.writeFile(
    FILE,
    JSON.stringify({ templates: next }, null, 2) + "\n",
    "utf-8",
  );
}
