import { fromIsoDay } from "./week"

/** Whole weeks from Monday `a` to Monday `b` (negative if b is earlier). */
export function weeksBetween(a: string, b: string): number {
  return Math.round((fromIsoDay(b).getTime() - fromIsoDay(a).getTime()) / (7 * 864e5))
}

/**
 * Which week offsets (0…span) get an x-axis label, given room for at most `maxLabels`.
 * Labels fall on an even step from the first week; the last week is labelled too
 * unless it would sit too close to the previous label.
 */
export function weekTicks(span: number, maxLabels: number): number[] {
  if (span <= 0) return [0]
  const room = Math.max(2, Math.floor(maxLabels))
  const step = Math.max(1, Math.ceil(span / (room - 1)))
  const ticks: number[] = []
  for (let w = 0; w <= span; w += step) ticks.push(w)
  const last = ticks[ticks.length - 1]
  if (last !== span) {
    if (span - last > step / 2) ticks.push(span)
    else ticks[ticks.length - 1] = span
  }
  return ticks
}
