import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_TERM_TEMPLATE } from "./term-template";

/** Persist each NGO's custom agreement template; use DEFAULT_TERM_TEMPLATE when none is stored. */

type StoredTemplate = { ngoId: string; body: string; updatedAt: string };

const FILE = path.join(process.cwd(), "src", "data", "term-templates.json");

async function read(): Promise<StoredTemplate[]> {
  const raw = await fs.readFile(FILE, "utf-8");
  return (JSON.parse(raw) as { templates: StoredTemplate[] }).templates;
}

export async function getTermTemplate(
  ngoId: string,
): Promise<{ body: string; isCustom: boolean }> {
  const found = (await read()).find((t) => t.ngoId === ngoId);
  return found
    ? { body: found.body, isCustom: true }
    : { body: DEFAULT_TERM_TEMPLATE, isCustom: false };
}

/** Save the NGO template. An empty body restores the default. */
export async function saveTermTemplate(
  ngoId: string,
  body: string,
): Promise<void> {
  const others = (await read()).filter((t) => t.ngoId !== ngoId);
  const next = body.trim()
    ? [...others, { ngoId, body, updatedAt: new Date().toISOString() }]
    : others;
  await fs.writeFile(
    FILE,
    JSON.stringify({ templates: next }, null, 2) + "\n",
    "utf-8",
  );
}
