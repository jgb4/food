import { useCallback, useEffect, useState } from "react"
import { ApiError, type Api } from "@/lib/api"
import type { Dish, Idea } from "@/lib/types"

/** Loads dishes and ideas, and refreshes every minute and whenever the tab comes back into view. */
export function useMaison(api: Api, onLocked: () => void) {
  const [dishes, setDishes] = useState<Dish[] | null>(null)
  const [ideas, setIdeas] = useState<Idea[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [d, i] = await Promise.all([api.listDishes(), api.listIdeas()])
      setDishes(d)
      setIdeas(i)
      setError(null)
    } catch (e) {
      if (e instanceof ApiError && e.wrongPasscode) onLocked()
      else setError(e instanceof Error ? e.message : "Couldn't load Maison Emma.")
    }
  }, [api, onLocked])

  useEffect(() => {
    refresh()
    const onVisible = () => { if (!document.hidden) refresh() }
    const timer = setInterval(onVisible, 60_000)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [refresh])

  return { dishes, ideas, error, refresh }
}

/** Photos need the passcode header, so they're fetched once and shown from object URLs. */
const photoCache = new Map<string, Promise<string>>()

export function primePhoto(id: string, blob: Blob) {
  photoCache.set(id, Promise.resolve(URL.createObjectURL(blob)))
}

export function usePhotoUrl(api: Api, id: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!id) { setUrl(null); return }
    let alive = true
    let p = photoCache.get(id)
    if (!p) {
      p = api.photoBlob(id).then((b) => URL.createObjectURL(b))
      photoCache.set(id, p)
      p.catch(() => photoCache.delete(id))
    }
    p.then((u) => alive && setUrl(u), () => alive && setUrl(null))
    return () => { alive = false }
  }, [api, id])
  return url
}
