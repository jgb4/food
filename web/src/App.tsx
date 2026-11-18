import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/sonner"
import { Brand } from "@/components/brand"
import { DishDialog } from "@/components/dish-dialog"
import { DishesTable } from "@/components/dishes-table"
import { IdeasView } from "@/components/ideas-view"
import { PasscodeGate } from "@/components/passcode-gate"
import { useMaison } from "@/hooks/use-maison"
import { ApiError, createApi, storedPasscode, type Api } from "@/lib/api"
import { DEFAULT_SORT } from "@/lib/sort"
import type { Dish, Idea, Sort } from "@/lib/types"

// Old links end in #dishes or #ideas: open the tab they meant, then drop the tail from the address.
const initialTab = location.hash === "#ideas" ? "ideas" : "dishes"
if (location.hash) history.replaceState(null, "", location.pathname + location.search)

export default function App() {
  const [passcode, setPasscode] = useState(storedPasscode.get)
  const api = useMemo(() => (passcode ? createApi(passcode) : null), [passcode])
  const lock = useCallback(() => { storedPasscode.set(""); setPasscode("") }, [])

  return (
    <>
      {api ? <Home api={api} onLocked={lock} /> : <PasscodeGate onUnlock={(p) => { storedPasscode.set(p); setPasscode(p) }} />}
      <Toaster position="bottom-center" />
    </>
  )
}

function Home({ api, onLocked }: { api: Api; onLocked: () => void }) {
  const { dishes, ideas, error, refresh } = useMaison(api, onLocked)
  const [tab, setTab] = useState(initialTab)
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT)
  const [dialog, setDialog] = useState<{ open: boolean; dish: Dish | null; fromIdea: Idea | null }>({ open: false, dish: null, fromIdea: null })

  const onError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.wrongPasscode) onLocked()
    return e instanceof Error ? e.message : "Something went wrong. Try again."
  }, [onLocked])

  const openDish = (dish: Dish | null, fromIdea: Idea | null = null) => setDialog({ open: true, dish, fromIdea })
  const list = dishes ?? []
  const avg = list.length ? list.reduce((s, d) => s + d.score, 0) / list.length : null
  const best = list.length ? Math.max(...list.map((d) => d.score)) : null

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <header className="flex items-end justify-between gap-4 border-b py-5">
        <Brand />
        {list.length > 0 && (
          <dl className="flex gap-5 text-right text-sm">
            <Stat label="Dishes" value={String(list.length)} />
            <Stat label="Average" value={avg!.toFixed(1)} />
            <Stat label="Best" value={String(best)} />
          </dl>
        )}
      </header>

      <Tabs value={tab} onValueChange={setTab} className="mt-5 gap-4">
        <div className="flex items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="dishes">Past dishes</TabsTrigger>
            <TabsTrigger value="ideas">Future ideas</TabsTrigger>
          </TabsList>
          {tab === "dishes" && <Button onClick={() => openDish(null)}>Add dish</Button>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <TabsContent value="dishes">
          {dishes === null ? (
            !error && <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : dishes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">No dishes yet. After each dinner, add what Emma made with a photo, the week, a score and notes.</p>
              <Button variant="outline" onClick={() => openDish(null)}>Add the first dish</Button>
            </div>
          ) : (
            <>
              <DishesTable api={api} dishes={dishes} sort={sort} onSortChange={setSort} onEdit={(d) => openDish(d)} />
              <p className="mt-3 text-xs text-muted-foreground">Select a dish to edit or delete it.</p>
            </>
          )}
        </TabsContent>

        <TabsContent value="ideas">
          {ideas === null
            ? !error && <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
            : <IdeasView api={api} ideas={ideas} onChanged={refresh} onError={onError} onCooked={(idea) => openDish(null, idea)} />}
        </TabsContent>
      </Tabs>

      <DishDialog
        api={api}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        dish={dialog.dish}
        fromIdea={dialog.fromIdea}
        dishes={list}
        onChanged={refresh}
        onError={onError}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}
