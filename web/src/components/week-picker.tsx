import { useState } from "react"
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { daysOfWeek, fromIsoDay, mondayOf, toIsoDay, weekLabel, weeksOfMonth } from "@/lib/week"

type Props = {
  id?: string
  /** Monday of the chosen week, or "" */
  value: string
  onChange: (monday: string) => void
  /** Mondays of weeks that already have a dish */
  taken: string[]
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

/**
 * A month view where each row is one Monday–Sunday week and the row is the only thing you can pick.
 * (shadcn's Calendar selects single days, so weeks are laid out here with its Popover and Button.)
 */
export function WeekPicker({ id, value, onChange, taken }: Props) {
  const [open, setOpen] = useState(false)
  const start = fromIsoDay(value || mondayOf(new Date()))
  const [month, setMonth] = useState({ y: start.getFullYear(), m: start.getMonth() })
  const today = toIsoDay(new Date())
  const takenSet = new Set(taken)

  function onOpenChange(next: boolean) {
    if (next) setMonth({ y: start.getFullYear(), m: start.getMonth() })
    setOpen(next)
  }
  const shift = (n: number) => setMonth(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }))

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button id={id} variant="outline" className="w-full justify-between bg-transparent font-normal hover:bg-transparent aria-expanded:bg-transparent">
          {value ? `Week of ${weekLabel(value)}` : <span className="text-muted-foreground">Pick a week</span>}
          <CalendarIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="mb-2 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => shift(-1)}>
            <ChevronLeftIcon />
          </Button>
          <span className="text-sm font-medium">
            {new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => shift(1)}>
            <ChevronRightIcon />
          </Button>
        </div>

        <div className="grid grid-cols-7 px-1 pb-1 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
        </div>

        <div role="listbox" aria-label="Weeks" className="flex flex-col gap-0.5">
          {weeksOfMonth(month.y, month.m).map((monday) => {
            const isTaken = takenSet.has(monday)
            const selected = monday === value
            return (
              <button
                key={monday}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={`Week of ${weekLabel(monday)}${isTaken ? ", already has a dish" : ""}`}
                disabled={isTaken}
                title={isTaken ? "This week already has a dish" : undefined}
                onClick={() => { onChange(monday); setOpen(false) }}
                className={cn(
                  "grid grid-cols-7 rounded-md px-1 py-1.5 text-center text-sm tabular-nums transition-colors outline-none",
                  "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "bg-primary text-primary-foreground hover:bg-primary",
                  isTaken && "cursor-not-allowed line-through opacity-40 hover:bg-transparent"
                )}
              >
                {daysOfWeek(monday).map((d) => {
                  const iso = toIsoDay(d)
                  return (
                    <span
                      key={iso}
                      className={cn(
                        d.getMonth() !== month.m && !selected && "text-muted-foreground",
                        iso === today && "font-semibold underline underline-offset-4"
                      )}
                    >
                      {d.getDate()}
                    </span>
                  )
                })}
              </button>
            )
          })}
        </div>

        {taken.length > 0 && (
          <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">Crossed-out weeks already have a dish.</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
