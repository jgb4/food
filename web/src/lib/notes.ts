/** Notes on dishes and ideas are short, so they fit under the dish name on a phone. The worker enforces the same limit. */
export const NOTES_MAX = 40

/** How many characters are left; the countdown only appears for the last 10. */
export function notesRemaining(text: string): { left: number; show: boolean } {
  const left = NOTES_MAX - text.length
  return { left, show: left <= 10 }
}
