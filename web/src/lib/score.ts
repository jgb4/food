/**
 * Read a typed score. Accepts "7", "7.5" or "7,5"; rounds to the nearest half point.
 * Returns null for anything that isn't a number from 0 to 10.
 */
export function parseScore(text: string): number | null {
  const t = text.trim().replace(",", ".")
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return null
  const n = Number(t)
  if (!(n >= 0 && n <= 10)) return null
  return Math.round(n * 2) / 2
}
