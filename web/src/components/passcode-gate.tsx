import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Brand } from "@/components/brand"
import { createApi } from "@/lib/api"

export function PasscodeGate({ onUnlock }: { onUnlock: (passcode: string) => void }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!value) return
    setBusy(true)
    setError(null)
    try {
      await createApi(value).check()
      onUnlock(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't check the passcode.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center px-4 py-10">
      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-6">
        <Brand size="lg" />
        <Field data-invalid={!!error || undefined}>
          <FieldLabel htmlFor="passcode">House passcode</FieldLabel>
          <Input
            id="passcode"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={!!error || undefined}
          />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <Button type="submit" disabled={busy || !value}>
          {busy ? "Checking…" : "Open"}
        </Button>
      </form>
    </main>
  )
}
