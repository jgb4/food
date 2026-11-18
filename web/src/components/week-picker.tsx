import { useMemo, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fromIsoDay, mondayOf, sundayOf, weekLabel } from "@/lib/week"

type Props = {
  id?: string
  /** Monday of the chosen week, or "" */
  value: string
  onChange: (monday: string) => void
  /** Mondays of weeks that already have a dish */
  taken: string[]
  invalid?: boolean
}

/** A month calendar where clicking any day picks its whole Monday–Sunday week. */
export function WeekPicker({ id, value, onChange, taken, invalid }: Props) {
  const [open, setOpen] = useState(false)
  const takenRanges = useMemo(() => taken.map((m) => ({ from: fromIsoDay(m), to: sundayOf(m) })), [taken])
  const selected = value ? { from: fromIsoDay(value), to: sundayOf(value) } : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" className="w-full justify-between font-normal" aria-invalid={invalid || undefined}>
          {value ? `Week of ${weekLabel(value)}` : <span className="text-muted-foreground">Pick a week</span>}
          <CalendarIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={() => {}}
          onDayClick={(day, modifiers) => {
            if (modifiers.disabled) return
            onChange(mondayOf(day))
            setOpen(false)
          }}
          defaultMonth={selected?.from ?? new Date()}
          weekStartsOn={1}
          disabled={takenRanges}
          modifiers={{ taken: takenRanges }}
          modifiersClassNames={{ taken: "line-through" }}
        />
        {taken.length > 0 && (
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">Crossed-out weeks already have a dish.</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
