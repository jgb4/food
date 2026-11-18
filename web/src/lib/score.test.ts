import { describe, expect, it } from "vitest"
import { parseScore } from "./score"

describe("parseScore", () => {
  it("reads whole and half points", () => {
    expect(parseScore("7")).toBe(7)
    expect(parseScore("7.5")).toBe(7.5)
    expect(parseScore(" 10 ")).toBe(10)
    expect(parseScore("0")).toBe(0)
  })
  it("accepts a comma as the decimal mark", () => {
    expect(parseScore("8,5")).toBe(8.5)
  })
  it("rounds to the nearest half point", () => {
    expect(parseScore("7.3")).toBe(7.5)
    expect(parseScore("7.2")).toBe(7)
    expect(parseScore("9.9")).toBe(10)
  })
  it("rejects anything outside 0 to 10 or not a number", () => {
    for (const bad of ["", "-1", "11", "10.5", "abc", "7/10", "1e1"]) expect(parseScore(bad)).toBeNull()
  })
})
