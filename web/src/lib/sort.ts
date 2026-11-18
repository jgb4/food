import type { Dish, Sort, SortKey } from "./types"

export const DEFAULT_SORT: Sort = { key: "week", dir: "desc" }

/** Sort dishes by week or score. Ties fall back to newest week first. */
export function sortDishes(dishes: Dish[], sort: Sort): Dish[] {
  const m = sort.dir === "asc" ? 1 : -1
  const byWeek = (a: Dish, b: Dish) => a.weekOf.localeCompare(b.weekOf) || a.createdAt - b.createdAt
  const primary = sort.key === "score" ? (a: Dish, b: Dish) => a.score - b.score : byWeek
  return [...dishes].sort((a, b) => primary(a, b) * m || -byWeek(a, b))
}

/** Clicking the active column flips it; clicking the other column starts high-to-low / newest-first. */
export function nextSort(current: Sort, key: SortKey): Sort {
  if (current.key === key) return { key, dir: current.dir === "asc" ? "desc" : "asc" }
  return { key, dir: "desc" }
}
