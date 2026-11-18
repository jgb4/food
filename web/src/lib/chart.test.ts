import { describe, expect, it } from "vitest"
import { weekTicks, weeksBetween } from "./chart"

describe("weeksBetween", () => {
  it("counts whole weeks, across daylight-saving changes and years", () => {
    expect(weeksBetween("2026-10-26", "2026-11-02")).toBe(1)
    expect(weeksBetween("2026-09-14", "2026-11-16")).toBe(9)
    expect(weeksBetween("2026-12-28", "2027-01-04")).toBe(1)
    expect(weeksBetween("2026-11-16", "2026-11-16")).toBe(0)
  })
})

describe("weekTicks", () => {
  it("labels the only week when there is one", () => {
    expect(weekTicks(0, 6)).toEqual([0])
  })
  it("labels every week when there is room", () => {
    expect(weekTicks(3, 6)).toEqual([0, 1, 2, 3])
  })
  it("thins labels to fit and always ends on the last week", () => {
    expect(weekTicks(20, 5)).toEqual([0, 5, 10, 15, 20])
    expect(weekTicks(9, 4)).toEqual([0, 3, 6, 9])
    // 0,4,8 then the last week (10) is too close to 8, so it replaces it
    expect(weekTicks(10, 4)).toEqual([0, 4, 10])
  })
})
