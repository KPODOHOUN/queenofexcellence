/** Compare expected payment amount with KKiaPay value (tolerates string/float drift). */
export function paymentAmountMatches(expected: number, actual: unknown): boolean {
  if (actual === undefined || actual === null) return true;
  const a = Number(actual);
  const e = Number(expected);
  if (Number.isNaN(a) || Number.isNaN(e)) return false;
  return Math.abs(a - e) < 1;
}
