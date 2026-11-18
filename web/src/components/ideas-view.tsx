import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NotesInput } from "@/components/notes-input"
import type { Api } from "@/lib/api"
import type { Idea } from "@/lib/types"

type Props = {
  api: Api
  ideas: Idea[]
  onChanged: () => void
  onError: (e: unknown) => string
  onCooked: (idea: Idea) => void
}

export function IdeasView({ api, ideas, onChanged, onError, onCooked }: Props) {
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Idea | null>(null)
  const [deleting, setDeleting] = useState<Idea | null>(null)
  const list = [...ideas].sort((a, b) => b.createdAt - a.createdAt)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    try {
      await api.addIdea({ name: name.trim(), notes: notes.trim() })
      setName("")
      setNotes("")
      toast.success("Idea saved")
      onChanged()
    } catch (err) {
      toast.error(onError(err))
    } finally {
      setAdding(false)
    }
  }

  async function remove() {
    if (!deleting) return
    try {
      await api.deleteIdea(deleting.id)
      toast.success("Idea deleted")
      onChanged()
    } catch (err) {
      toast.error(onError(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-col gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New idea, e.g. mushroom risotto" aria-label="Idea" maxLength={120} />
          {name && (
            <NotesInput value={notes} onChange={setNotes} placeholder="Notes, e.g. what to buy" aria-label="Notes" />
          )}
        </div>
        <Button type="submit" disabled={adding || !name.trim()}>Add idea</Button>
      </form>

      {list.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No ideas yet.</p>
      ) : (
        <ul className="divide-y border-y">
          {list.map((idea) => (
            <li key={idea.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="font-medium">{idea.name}</div>
                {idea.notes && <p className="mt-0.5 text-sm whitespace-pre-wrap text-muted-foreground">{idea.notes}</p>}
              </div>
              <div className="-ml-2.5 flex shrink-0 gap-1 sm:ml-0">
                <Button variant="ghost" size="sm" onClick={() => onCooked(idea)}>Cooked it</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(idea)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setDeleting(idea)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <EditIdeaDialog api={api} idea={editing} onClose={() => setEditing(null)} onChanged={onChanged} onError={onError} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This idea and its notes will be removed for everyone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditIdeaDialog({ api, idea, onClose, onChanged, onError }: {
  api: Api; idea: Idea | null; onClose: () => void; onChanged: () => void; onError: (e: unknown) => string
}) {
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastId, setLastId] = useState<string | null>(null)
  if (idea && idea.id !== lastId) {
    setLastId(idea.id)
    setName(idea.name)
    setNotes(idea.notes)
    setError(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!idea || !name.trim()) return
    setSaving(true)
    try {
      await api.updateIdea(idea.id, { name: name.trim(), notes: notes.trim() })
      toast.success("Idea updated")
      onChanged()
      setLastId(null)
      onClose()
    } catch (err) {
      setError(onError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!idea} onOpenChange={(o) => { if (!o) { setLastId(null); onClose() } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit idea</DialogTitle></DialogHeader>
        <form id="idea-form" onSubmit={save}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="idea-name">Idea</FieldLabel>
              <Input id="idea-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </Field>
            <Field>
              <FieldLabel htmlFor="idea-notes">Notes</FieldLabel>
              <NotesInput id="idea-notes" value={notes} onChange={setNotes} />
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { setLastId(null); onClose() }}>Cancel</Button>
          <Button type="submit" form="idea-form" disabled={saving || !name.trim()}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
