// Every dish belongs to one week, identified by that week's Monday as "YYYY-MM-DD".
// Dates are handled at local noon so daylight-saving shifts never move a day.

export function toIsoDay(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}

export function fromIsoDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Monday of the week containing `day` (Monday-first weeks). */
export function mondayOf(day: Date | string): string {
  const d = typeof day === "string" ? fromIsoDay(day) : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toIsoDay(d)
}

/** Sunday at the end of the week that starts on `monday`. */
export function sundayOf(monday: string): Date {
  const d = fromIsoDay(monday)
  d.setDate(d.getDate() + 6)
  return d
}

/** "9/14/2026" */
export function weekLabel(monday: string): string {
  const d = fromIsoDay(monday)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

/** ISO-8601 week number. */
export function isoWeek(day: string): number {
  const d = fromIsoDay(day)
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dow = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dow)
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 864e5 + 1) / 7)
}
