import { cookies } from "next/headers";
import { distancesFromCep, distancesFromCoords } from "./geo";

/**
 * Localização de referência do adotante: a do navegador (cookie, guardada com
 * precisão de ~1 km) ou, se não houver, o CEP do perfil. Só roda no servidor.
 */
export const LOCATION_COOKIE = "petfinder_loc";

export type SavedLocation = { lat: number; lon: number };

export async function readSavedLocation(): Promise<SavedLocation | null> {
  const raw = (await cookies()).get(LOCATION_COOKIE)?.value;
  if (!raw) return null;
  const [lat, lon] = raw.split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/** Distância até cada ONG a partir da melhor referência disponível. */
export async function distancesForAdopter(
  adopterCep: string,
  ongs: Map<string, { cep: string }>,
): Promise<{
  distances: Map<string, number | null>;
  source: "gps" | "cep" | null;
}> {
  const ongCeps = new Map([...ongs].map(([id, ong]) => [id, ong.cep]));
  const saved = await readSavedLocation();
  if (saved) {
    return {
      distances: await distancesFromCoords(saved, ongCeps),
      source: "gps",
    };
  }
  if (adopterCep) {
    return {
      distances: await distancesFromCep(adopterCep, ongCeps),
      source: "cep",
    };
  }
  return { distances: new Map(), source: null };
}
