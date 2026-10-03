/** "menos de 1 km", "7 km" ou "1.240 km". Sem Node: usado no client. */
export function formatDistanceKm(km: number): string {
  if (km < 1) return "menos de 1 km";
  return `${Math.round(km).toLocaleString("pt-BR")} km`;
}
