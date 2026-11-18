import { describe, expect, it } from "vitest"
import { daysOfWeek, isoWeek, mondayOf, sundayOf, toIsoDay, weekLabel, weeksOfMonth } from "./week"

describe("weeksOfMonth", () => {
  it("lists every Monday-start week touching the month", () => {
    // November 2026 starts on a Sunday and ends on a Monday
    expect(weeksOfMonth(2026, 10)).toEqual(["2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"])
  })
  it("handles a month that starts on a Monday", () => {
    // June 2026 starts on a Monday
    expect(weeksOfMonth(2026, 5)[0]).toBe("2026-06-01")
  })
  it("handles February and the year boundary", () => {
    expect(weeksOfMonth(2027, 1)).toEqual(["2027-02-01", "2027-02-08", "2027-02-15", "2027-02-22"])
    expect(weeksOfMonth(2026, 11).at(-1)).toBe("2026-12-28")
  })
})

describe("daysOfWeek", () => {
  it("gives Monday through Sunday", () => {
    expect(daysOfWeek("2026-11-30").map(toIsoDay)).toEqual([
      "2026-11-30", "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06",
    ])
  })
})

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
