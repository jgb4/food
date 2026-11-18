import { Input } from "@/components/ui/input"
import { NOTES_MAX, notesRemaining } from "@/lib/notes"
import { cn } from "@/lib/utils"

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "maxLength"> & {
  value: string
  onChange: (value: string) => void
}

/** A one-line notes box capped at 40 characters, with a faint count inside it for the last 10. */
export function NotesInput({ value, onChange, className, ...props }: Props) {
  const { left, show } = notesRemaining(value)
  return (
    <div className="relative">
      <Input
        {...props}
        value={value}
        maxLength={NOTES_MAX}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        className={cn(show && "pr-9", className)}
      />
      {show && (
        <span aria-live="polite" className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground/70 tabular-nums">
          {left}
        </span>
      )}
    </div>
  )
}
