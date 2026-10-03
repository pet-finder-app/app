/**
 * Distância aproximada entre dois CEPs. Só roda no servidor: consulta a
 * BrasilAPI (que devolve coordenadas do CEP) e, se ela não souber, o
 * Nominatim/OpenStreetMap. Só o CEP sai do app. O resultado fica em memória
 * (o backend real pode trocar isso por um serviço de geocodificação).
 */

type Coords = { lat: number; lon: number };

const cache = new Map<string, Coords | null>();

async function fromBrasilApi(cep: string): Promise<Coords | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as {
    location?: { coordinates?: { latitude?: string; longitude?: string } };
  };
  const lat = Number(data.location?.coordinates?.latitude);
  const lon = Number(data.location?.coordinates?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

async function fromNominatim(cep: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${cep.slice(0, 5)}-${cep.slice(5)}&country=Brazil&format=json&limit=1`;
  const response = await fetch(url, {
    headers: { "User-Agent": "petfinder-app" },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) return null;
  const [first] = (await response.json()) as { lat: string; lon: string }[];
  if (!first) return null;
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

async function geocodeCep(rawCep: string): Promise<Coords | null> {
  const cep = rawCep.replace(/\D/g, "");
  if (cep.length !== 8) return null;
  if (cache.has(cep)) return cache.get(cep) ?? null;
  let coords: Coords | null = null;
  try {
    coords = (await fromBrasilApi(cep)) ?? (await fromNominatim(cep));
  } catch {
    // Sem internet ou serviço fora do ar: a tela só não mostra a distância.
    return null;
  }
  cache.set(cep, coords);
  return coords;
}

function haversineKm(a: Coords, b: Coords): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Distância em km em linha reta entre dois CEPs, ou null se não der para calcular. */
export async function distanceKmBetweenCeps(
  cepA: string,
  cepB: string,
): Promise<number | null> {
  const [a, b] = await Promise.all([geocodeCep(cepA), geocodeCep(cepB)]);
  return a && b ? haversineKm(a, b) : null;
}

export { formatDistanceKm } from "./format-distance";

/**
 * Distância em km de uma coordenada (ex.: a localização do navegador) até cada
 * ONG, localizada pelo CEP dela.
 */
export async function distancesFromCoords(
  origin: Coords,
  ongCeps: Map<string, string>,
): Promise<Map<string, number | null>> {
  const entries = await Promise.all(
    [...ongCeps].map(async ([ongId, cep]) => {
      const target = cep ? await geocodeCep(cep) : null;
      return [ongId, target ? haversineKm(origin, target) : null] as const;
    }),
  );
  return new Map(entries);
}

/**
 * Distância em km do CEP de referência até cada ONG (chave = id da ONG).
 * ONGs sem CEP, ou que não deram para localizar, ficam com `null`.
 */
export async function distancesFromCep(
  originCep: string,
  ongCeps: Map<string, string>,
): Promise<Map<string, number | null>> {
  const entries = await Promise.all(
    [...ongCeps].map(
      async ([ongId, cep]) =>
        [
          ongId,
          cep ? await distanceKmBetweenCeps(originCep, cep) : null,
        ] as const,
    ),
  );
  return new Map(entries);
}
