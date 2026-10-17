/** Server-side approximate distance using BrasilAPI postal-code coordinates and Nominatim fallback. Only the postal code leaves the app; cache results in memory. */

type Coords = { lat: number; lon: number };

const cache = new Map<string, Coords | null>();

async function fromBrasilApi(postalCode: string): Promise<Coords | null> {
  const response = await fetch(
    `https://brasilapi.com.br/api/cep/v2/${postalCode}`,
    {
      signal: AbortSignal.timeout(6000),
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as {
    location?: { coordinates?: { latitude?: string; longitude?: string } };
  };
  const lat = Number(data.location?.coordinates?.latitude);
  const lon = Number(data.location?.coordinates?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

async function fromNominatim(postalCode: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${postalCode.slice(0, 5)}-${postalCode.slice(5)}&country=Brazil&format=json&limit=1`;
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

async function geocodePostalCode(
  rawPostalCode: string,
): Promise<Coords | null> {
  const postalCode = rawPostalCode.replace(/\D/g, "");
  if (postalCode.length !== 8) return null;
  if (cache.has(postalCode)) return cache.get(postalCode) ?? null;
  let coords: Coords | null = null;
  try {
    coords =
      (await fromBrasilApi(postalCode)) ?? (await fromNominatim(postalCode));
  } catch {
    // If the network or geocoding service fails, omit the distance.
    return null;
  }
  cache.set(postalCode, coords);
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

/** Straight-line distance between postal codes in kilometers, or null if unavailable. */
export async function distanceKmBetweenPostalCodes(
  postalCodeA: string,
  postalCodeB: string,
): Promise<number | null> {
  const [a, b] = await Promise.all([
    geocodePostalCode(postalCodeA),
    geocodePostalCode(postalCodeB),
  ]);
  return a && b ? haversineKm(a, b) : null;
}

export { formatDistanceKm } from "./format-distance";

/** Distance from reference coordinates to each NGO's postal-code location. */
export async function distancesFromCoords(
  origin: Coords,
  ngoPostalCodes: Map<string, string>,
): Promise<Map<string, number | null>> {
  const entries = await Promise.all(
    [...ngoPostalCodes].map(async ([ngoId, postalCode]) => {
      const target = postalCode ? await geocodePostalCode(postalCode) : null;
      return [ngoId, target ? haversineKm(origin, target) : null] as const;
    }),
  );
  return new Map(entries);
}

/** Distance from a reference postal code to each NGO. Missing or unresolved locations produce null. */
export async function distancesFromPostalCode(
  originPostalCode: string,
  ngoPostalCodes: Map<string, string>,
): Promise<Map<string, number | null>> {
  const entries = await Promise.all(
    [...ngoPostalCodes].map(
      async ([ngoId, postalCode]) =>
        [
          ngoId,
          postalCode
            ? await distanceKmBetweenPostalCodes(originPostalCode, postalCode)
            : null,
        ] as const,
    ),
  );
  return new Map(entries);
}
