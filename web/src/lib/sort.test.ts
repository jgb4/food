import { describe, expect, it } from "vitest"
import { DEFAULT_SORT, nextSort, sortDishes } from "./sort"
import type { Dish } from "./types"

const dish = (name: string, weekOf: string, score: number, createdAt = 0): Dish =>
  ({ id: name, name, weekOf, score, notes: "", photo: null, createdAt, updatedAt: createdAt })

const dishes = [
  dish("kabobs", "2026-09-14", 8),
  dish("risotto", "2026-11-16", 6.5),
  dish("tagine", "2026-10-05", 9),
  dish("soup", "2026-10-12", 6.5),
]
const names = (s: Parameters<typeof sortDishes>[1]) => sortDishes(dishes, s).map((d) => d.name)

describe("sortDishes", () => {
  it("defaults to newest week first", () => {
    expect(names(DEFAULT_SORT)).toEqual(["risotto", "soup", "tagine", "kabobs"])
  })
  it("sorts by week ascending", () => {
    expect(names({ key: "week", dir: "asc" })).toEqual(["kabobs", "tagine", "soup", "risotto"])
  })
  it("sorts by score, breaking ties by newest week", () => {
    expect(names({ key: "score", dir: "desc" })).toEqual(["tagine", "kabobs", "risotto", "soup"])
    expect(names({ key: "score", dir: "asc" })).toEqual(["risotto", "soup", "kabobs", "tagine"])
  })
  it("does not mutate its input", () => {
    const before = dishes.map((d) => d.name)
    sortDishes(dishes, { key: "score", dir: "asc" })
    expect(dishes.map((d) => d.name)).toEqual(before)
  })
})

describe("nextSort", () => {
  it("flips the active column", () => {
    expect(nextSort({ key: "week", dir: "desc" }, "week")).toEqual({ key: "week", dir: "asc" })
    expect(nextSort({ key: "week", dir: "asc" }, "week")).toEqual({ key: "week", dir: "desc" })
  })
  it("starts a new column high-to-low", () => {
    expect(nextSort({ key: "week", dir: "asc" }, "score")).toEqual({ key: "score", dir: "desc" })
  })
})
