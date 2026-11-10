import { cookies } from "next/headers";
export const LOCATION_COOKIE = "petfinder_loc";
export const LOCATION_ENABLED_COOKIE = "petfinder_location_enabled";
export type SavedLocation = { lat: number; lon: number };
export async function isLocationEnabled(): Promise<boolean> {
  return (await cookies()).get(LOCATION_ENABLED_COOKIE)?.value !== "0";
}
export async function readSavedLocation(): Promise<SavedLocation | null> {
  if (!(await isLocationEnabled())) return null;
  const [lat, lon] = ((await cookies()).get(LOCATION_COOKIE)?.value ?? "")
    .split(",")
    .map(Number);
  return Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
}
