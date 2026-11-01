import { cookies } from "next/headers";
import { distancesFromCoords, distancesFromPostalCode } from "./geo";

/** Server-side adopter location reference: approximate browser coordinates from the cookie, falling back to the profile postal code. */
export const LOCATION_COOKIE = "petfinder_loc";
export const LOCATION_ENABLED_COOKIE = "petfinder_location_enabled";

export type SavedLocation = { lat: number; lon: number };

/** Location starts enabled until the adopter disables it or denies permission. */
export async function isLocationEnabled(): Promise<boolean> {
  return (await cookies()).get(LOCATION_ENABLED_COOKIE)?.value !== "0";
}

export async function readSavedLocation(): Promise<SavedLocation | null> {
  if (!(await isLocationEnabled())) return null;
  const raw = (await cookies()).get(LOCATION_COOKIE)?.value;
  if (!raw) return null;
  const [lat, lon] = raw.split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

/** Distances to NGOs using the best available location reference. */
export async function distancesForAdopter(
  adopterPostalCode: string,
  ngos: Map<string, { postalCode: string }>,
  useBrowserCoordinates = true,
): Promise<{
  distances: Map<string, number | null>;
  source: "gps" | "postalCode" | null;
}> {
  const ngoPostalCodes = new Map(
    [...ngos].map(([id, ngo]) => [id, ngo.postalCode]),
  );
  const saved = useBrowserCoordinates ? await readSavedLocation() : null;
  if (saved) {
    return {
      distances: await distancesFromCoords(saved, ngoPostalCodes),
      source: "gps",
    };
  }
  if (adopterPostalCode) {
    return {
      distances: await distancesFromPostalCode(
        adopterPostalCode,
        ngoPostalCodes,
      ),
      source: "postalCode",
    };
  }
  return { distances: new Map(), source: null };
}
