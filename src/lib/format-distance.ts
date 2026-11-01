/** Localized distance label in kilometers; client-safe. */
export function formatDistanceKm(km: number): string {
  if (km < 1) return "menos de 1 km";
  return `${Math.round(km).toLocaleString("pt-BR")} km`;
}
