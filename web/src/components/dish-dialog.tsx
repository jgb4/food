import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { WeekPicker } from "@/components/week-picker"
import { primePhoto, usePhotoUrl } from "@/hooks/use-maison"
import type { Api } from "@/lib/api"
import { isHeic, preparePhoto } from "@/lib/photo"
import type { Dish, Idea } from "@/lib/types"
import { mondayOf, weekLabel } from "@/lib/week"

type Props = {
  api: Api
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The dish being edited; null to add a new one */
  dish: Dish | null
  /** When adding a dish from a future idea, it's prefilled and the idea is removed on save */
  fromIdea?: Idea | null
  /** All dishes, to block weeks that already have one */
  dishes: Dish[]
  onChanged: () => void
  onError: (e: unknown) => string
}

type PhotoState = { kind: "keep" } | { kind: "none" } | { kind: "new"; blob: Blob; url: string }

export function DishDialog({ api, open, onOpenChange, dish, fromIdea, dishes, onChanged, onError }: Props) {
  const [name, setName] = useState("")
  const [weekOf, setWeekOf] = useState("")
  const [score, setScore] = useState(7)
  const [notes, setNotes] = useState("")
  const [photo, setPhoto] = useState<PhotoState>({ kind: "keep" })
  const [photoBusy, setPhotoBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const savedPhotoUrl = usePhotoUrl(api, dish?.photo ?? null)

  const taken = dishes.filter((d) => d.id !== dish?.id).map((d) => mondayOf(d.weekOf))
  const takenBy = new Map(dishes.filter((d) => d.id !== dish?.id).map((d) => [mondayOf(d.weekOf), d.name]))

  // Reset the form each time it opens.
  useEffect(() => {
    if (!open) return
    const thisWeek = mondayOf(new Date())
    setName(dish?.name ?? fromIdea?.name ?? "")
    setWeekOf(dish ? mondayOf(dish.weekOf) : taken.includes(thisWeek) ? "" : thisWeek)
    setScore(dish?.score ?? 7)
    setNotes(dish?.notes ?? fromIdea?.notes ?? "")
    setPhoto({ kind: dish?.photo ? "keep" : "none" })
    setError(null)
    setSaving(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dish, fromIdea])

  const previewUrl = photo.kind === "new" ? photo.url : photo.kind === "keep" ? savedPhotoUrl : null

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setError(null)
    setPhotoBusy(isHeic(file) ? "Converting iPhone photo…" : "Preparing photo…")
    try {
      const blob = await preparePhoto(file)
      setPhoto({ kind: "new", blob, url: URL.createObjectURL(blob) })
    } catch {
      setError("Couldn't read that photo. Try a different one.")
    } finally {
      setPhotoBusy(null)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError("Give the dish a name.")
    if (!weekOf) return setError("Pick the week it was cooked.")
    if (takenBy.has(weekOf)) return setError(`The week of ${weekLabel(weekOf)} already has ${takenBy.get(weekOf)}.`)
    setSaving(true)
    setError(null)
    try {
      let photoId = dish?.photo ?? null
      if (photo.kind === "new") {
        const { id } = await api.uploadPhoto(photo.blob)
        primePhoto(id, photo.blob)
        photoId = id
      } else if (photo.kind === "none") {
        photoId = null
      }
      const input = { name: name.trim(), weekOf, score, notes: notes.trim(), photo: photoId }
      if (dish) await api.updateDish(dish.id, input)
      else await api.addDish(input)
      if (dish?.photo && dish.photo !== photoId) await api.deletePhoto(dish.photo).catch(() => {})
      if (fromIdea) await api.deleteIdea(fromIdea.id).catch(() => {})
      toast.success(dish ? "Dish updated" : "Dish added")
      onChanged()
      onOpenChange(false)
    } catch (err) {
      setError(onError(err))
      setSaving(false)
    }
  }

  async function remove() {
    if (!dish) return
    try {
      await api.deleteDish(dish.id)
      toast.success("Dish deleted")
      onChanged()
      setConfirmDelete(false)
      onOpenChange(false)
    } catch (err) {
      setConfirmDelete(false)
      setError(onError(err))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dish ? "Edit dish" : "Add dish"}</DialogTitle>
          </DialogHeader>
          <form id="dish-form" onSubmit={save}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="dish-name">Dish</FieldLabel>
                <Input id="dish-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Coq au vin" />
              </Field>
              <Field>
                <FieldLabel htmlFor="dish-week">Week</FieldLabel>
                <WeekPicker id="dish-week" value={weekOf} onChange={setWeekOf} taken={taken} />
              </Field>
              <Field>
                <div className="flex items-baseline justify-between">
                  <FieldLabel htmlFor="dish-score">Score</FieldLabel>
                  <span className="text-sm font-medium tabular-nums">
                    {score}<span className="text-muted-foreground">/10</span>
                  </span>
                </div>
                <Slider id="dish-score" min={0} max={10} step={0.5} value={[score]} onValueChange={([v]) => setScore(v)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="dish-photo">Photo</FieldLabel>
                {previewUrl && <img src={previewUrl} alt="" className="aspect-[4/3] w-full rounded-md border object-cover" />}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={!!photoBusy} onClick={() => fileRef.current?.click()}>
                    {photoBusy ?? (previewUrl ? "Change photo" : "Add photo")}
                  </Button>
                  {previewUrl && !photoBusy && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto({ kind: "none" })}>
                      Remove
                    </Button>
                  )}
                </div>
                <input id="dish-photo" ref={fileRef} type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              </Field>
              <Field>
                <FieldLabel htmlFor="dish-notes">Notes</FieldLabel>
                <Textarea id="dish-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What worked, what to ask for next time" />
              </Field>
              {error && <FieldError>{error}</FieldError>}
            </FieldGroup>
          </form>
          <DialogFooter className="sm:justify-between">
            {dish ? (
              <Button type="button" variant="ghost" className="text-destructive hover:text-destructive sm:-ml-2.5" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : <span />}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" form="dish-form" disabled={saving || !!photoBusy}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {dish?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the dish, its score, notes and photo for everyone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
