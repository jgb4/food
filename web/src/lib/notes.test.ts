import { describe, expect, it } from "vitest"
import { NOTES_MAX, notesRemaining } from "./notes"

describe("notesRemaining", () => {
  it("allows 40 characters", () => {
    expect(NOTES_MAX).toBe(40)
  })
  it("stays hidden until the last 10 characters", () => {
    expect(notesRemaining("")).toEqual({ left: 40, show: false })
    expect(notesRemaining("x".repeat(29))).toEqual({ left: 11, show: false })
    expect(notesRemaining("x".repeat(30))).toEqual({ left: 10, show: true })
    expect(notesRemaining("x".repeat(40))).toEqual({ left: 0, show: true })
  })
})
