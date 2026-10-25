/** Affiche vote_count même si converti par erreur en booléen (0/1). */
export function displayVoteCount(value: unknown): number {
  if (typeof value === "boolean") return value ? 1 : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
