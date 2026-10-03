import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Pedidos de redefinição de senha. Hoje um arquivo JSON, amanhã o backend —
 * que envia o link por e-mail. No protótipo o link volta na resposta e a
 * tela o mostra (como o código de assinatura do termo).
 */

type Reset = {
  token: string;
  userId: string;
  /** ISO datetime. */
  expiresAt: string;
};

const RESETS_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "password-resets.json",
);
const TTL_MS = 30 * 60 * 1000;

async function readResets(): Promise<Reset[]> {
  const raw = await fs.readFile(RESETS_FILE, "utf-8");
  return (JSON.parse(raw) as { resets: Reset[] }).resets;
}

async function writeResets(resets: Reset[]): Promise<void> {
  await fs.writeFile(
    RESETS_FILE,
    JSON.stringify({ resets }, null, 2) + "\n",
    "utf-8",
  );
}

/** Cria um token de uso único (30 min) e descarta os antigos do mesmo usuário. */
export async function createPasswordReset(userId: string): Promise<string> {
  const now = new Date().toISOString();
  const resets = (await readResets()).filter(
    (r) => r.userId !== userId && r.expiresAt > now,
  );
  const token = randomBytes(24).toString("hex");
  await writeResets([
    ...resets,
    {
      token,
      userId,
      expiresAt: new Date(Date.now() + TTL_MS).toISOString(),
    },
  ]);
  return token;
}

/** Consome o token: devolve o id do usuário se ele for válido, e já o invalida. */
export async function consumePasswordReset(
  token: string,
): Promise<string | null> {
  const resets = await readResets();
  const found = resets.find((r) => r.token === token);
  if (!found) return null;
  await writeResets(resets.filter((r) => r.token !== token));
  return found.expiresAt > new Date().toISOString() ? found.userId : null;
}
