import type { Dish, DishInput, Idea, IdeaInput } from "./types"

/** Cloudflare Worker in food/api (deployed as maison-emma-api). Every request needs the house passcode. */
export const API_BASE = "https://maison-emma-api.gift-ideas-api.workers.dev"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
  get wrongPasscode() {
    return this.status === 401
  }
}

type Fetch = typeof fetch

export function createApi(passcode: string, fetchImpl: Fetch = (...a) => fetch(...a)) {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { "X-Passcode": passcode }
    let payload: BodyInit | undefined
    if (body instanceof Blob) {
      headers["Content-Type"] = body.type || "image/jpeg"
      payload = body
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json"
      payload = JSON.stringify(body)
    }
    let res: Response
    try {
      res = await fetchImpl(API_BASE + path, { method, headers, body: payload })
    } catch {
      throw new ApiError(0, "Couldn't reach Maison Emma. Check your connection and try again.")
    }
    if (res.status === 204) return undefined as T
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new ApiError(res.status, messageFor(res.status, data?.error))
    return data as T
  }

  return {
    check: () => call<{ ok: true }>("POST", "/api/check"),
    listDishes: () => call<Dish[]>("GET", "/api/dishes"),
    addDish: (d: DishInput) => call<Dish>("POST", "/api/dishes", d),
    updateDish: (id: string, d: Partial<DishInput>) => call<Dish>("PATCH", `/api/dishes/${id}`, d),
    deleteDish: (id: string) => call<void>("DELETE", `/api/dishes/${id}`),
    listIdeas: () => call<Idea[]>("GET", "/api/ideas"),
    addIdea: (d: IdeaInput) => call<Idea>("POST", "/api/ideas", d),
    updateIdea: (id: string, d: Partial<IdeaInput>) => call<Idea>("PATCH", `/api/ideas/${id}`, d),
    deleteIdea: (id: string) => call<void>("DELETE", `/api/ideas/${id}`),
    uploadPhoto: (jpeg: Blob) => call<{ id: string }>("POST", "/api/photos", jpeg),
    deletePhoto: (id: string) => call<void>("DELETE", `/api/photos/${id}`),
    async photoBlob(id: string): Promise<Blob> {
      const res = await fetchImpl(`${API_BASE}/api/photos/${id}`, { headers: { "X-Passcode": passcode } })
      if (!res.ok) throw new ApiError(res.status, "Photo not found")
      return res.blob()
    },
  }
}

export type Api = ReturnType<typeof createApi>

function messageFor(status: number, serverMessage?: string): string {
  if (status === 401) return "That's not the passcode."
  if (status === 409) return "That week already has a dish. Pick another week."
  if (status === 413) return "That photo is too big. Try a smaller one."
  if (serverMessage && status < 500) return serverMessage
  return "Something went wrong saving that. Try again."
}

const PASS_KEY = "me-passcode"
export const storedPasscode = {
  get(): string {
    try { return localStorage.getItem(PASS_KEY) ?? "" } catch { return "" }
  },
  set(v: string) {
    try { if (v) localStorage.setItem(PASS_KEY, v); else localStorage.removeItem(PASS_KEY) } catch { /* private mode */ }
  },
}
