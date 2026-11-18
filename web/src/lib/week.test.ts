import { describe, expect, it } from "vitest"
import { isoWeek, mondayOf, sundayOf, toIsoDay, weekLabel } from "./week"

describe("mondayOf", () => {
  it("maps every day of a week to its Monday", () => {
    for (const day of ["2026-11-16", "2026-11-18", "2026-11-21", "2026-11-22"]) {
      expect(mondayOf(day)).toBe("2026-11-16")
    }
  })
  it("crosses month and year boundaries", () => {
    expect(mondayOf("2026-11-01")).toBe("2026-10-26")
    expect(mondayOf("2027-01-02")).toBe("2026-12-28")
  })
  it("accepts Date objects", () => {
    expect(mondayOf(new Date(2026, 8, 17, 23, 59))).toBe("2026-09-14")
  })
  it("is stable across a daylight-saving change", () => {
    expect(mondayOf("2026-11-01")).toBe("2026-10-26")
    expect(mondayOf("2026-03-08")).toBe("2026-03-02")
  })
})

describe("labels", () => {
  it("shows the Monday as M/D/YYYY", () => {
    expect(weekLabel("2026-09-14")).toBe("9/14/2026")
  })
  it("gives ISO week numbers", () => {
    expect(isoWeek("2026-11-16")).toBe(47)
    expect(isoWeek("2026-12-28")).toBe(53)
    expect(isoWeek("2027-01-04")).toBe(1)
  })
  it("finds the Sunday ending a week", () => {
    expect(toIsoDay(sundayOf("2026-11-16"))).toBe("2026-11-22")
  })
})
