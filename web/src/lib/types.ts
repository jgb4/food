export type Dish = {
  id: string
  name: string
  /** Monday of the week it was cooked, YYYY-MM-DD */
  weekOf: string
  /** 0–10 in half points */
  score: number
  notes: string
  photo: string | null
  createdAt: number
  updatedAt: number
}

export type Idea = {
  id: string
  name: string
  notes: string
  createdAt: number
}

export type DishInput = Pick<Dish, "name" | "weekOf" | "score" | "notes" | "photo">
export type IdeaInput = Pick<Idea, "name" | "notes">

export type SortKey = "week" | "score"
export type SortDir = "asc" | "desc"
export type Sort = { key: SortKey; dir: SortDir }
