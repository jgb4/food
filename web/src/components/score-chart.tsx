import { useLayoutEffect, useRef, useState } from "react"
import { weekTicks, weeksBetween } from "@/lib/chart"
import type { Dish } from "@/lib/types"
import { fromIsoDay, mondayOf, shortWeekLabel, toIsoDay } from "@/lib/week"
import { cn } from "@/lib/utils"

const HEIGHT = 180
const M = { top: 8, right: 12, bottom: 22, left: 24 }
const Y_TICKS = [0, 2, 4, 6, 8, 10]
const INSET = 14

/** Score of every dish by the week it was cooked, from the first week to the latest. Empty weeks just have no dot. */
export function ScoreChart({ dishes }: { dishes: Dish[] }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [picked, setPicked] = useState<Dish | null>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const weeks = dishes.map((d) => mondayOf(d.weekOf)).sort()
  const first = weeks[0]
  const span = weeksBetween(first, weeks[weeks.length - 1])
  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = HEIGHT - M.top - M.bottom
  const crossesYear = fromIsoDay(first).getFullYear() !== new Date().getFullYear()
  const ticks = weekTicks(span, plotW / (crossesYear ? 96 : 64))

  // one week alone sits in the middle; otherwise the first and latest weeks sit at the edges
  // (inset from the axis so the end dots aren't cut in half)
  const x = (w: number) => M.left + INSET + (span === 0 ? (plotW - 2 * INSET) / 2 : (w / span) * (plotW - 2 * INSET))
  const y = (s: number) => M.top + plotH - (s / 10) * plotH
  const weekAt = (w: number) => {
    const d = fromIsoDay(first)
    d.setDate(d.getDate() + w * 7)
    return toIsoDay(d)
  }

  return (
    <section className="mt-10" aria-label="Score over time">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">Score over time</h2>
        <p className="truncate text-xs text-muted-foreground" aria-live="polite">{picked?.name}</p>
      </div>
      <div ref={box} className="w-full">
        {width > 0 && (
          <svg width={width} height={HEIGHT} className="block overflow-visible text-[11px]" onMouseLeave={() => setPicked(null)}>
            {Y_TICKS.map((s) => (
              <g key={s}>
                <line x1={M.left} x2={M.left + plotW} y1={y(s)} y2={y(s)} className={s === 0 ? "stroke-input" : "stroke-border"} strokeDasharray={s === 0 ? undefined : "2 3"} />
                <text x={M.left - 8} y={y(s)} dy="0.32em" textAnchor="end" className="fill-muted-foreground tabular-nums">{s}</text>
              </g>
            ))}
            <line x1={M.left} x2={M.left} y1={M.top} y2={M.top + plotH} className="stroke-input" />
            {ticks.map((w) => (
              <text
                key={w}
                x={x(w)}
                y={HEIGHT - 4}
                textAnchor="middle"
                className="fill-muted-foreground tabular-nums"
              >
                {shortWeekLabel(weekAt(w))}
              </text>
            ))}
            {/* the faintest line joining the dots in week order (each week has at most one dish) */}
            <polyline
              points={[...dishes].sort((a, b) => a.weekOf.localeCompare(b.weekOf)).map((d) => `${x(weeksBetween(first, mondayOf(d.weekOf)))},${y(d.score)}`).join(" ")}
              fill="none"
              strokeWidth={1}
              strokeLinejoin="round"
              className="stroke-primary opacity-15"
            />
            {dishes.map((d) => {
              const cx = x(weeksBetween(first, mondayOf(d.weekOf)))
              const cy = y(d.score)
              const on = picked?.id === d.id
              return (
                <g key={d.id} onMouseEnter={() => setPicked(d)} onClick={() => setPicked(on ? null : d)} className="cursor-default">
                  {/* a bigger invisible target so dots are easy to hit with a finger */}
                  <circle cx={cx} cy={cy} r={10} fill="transparent" />
                  <circle cx={cx} cy={cy} r={on ? 5 : 4} className={cn("fill-primary transition-[r]", !on && picked && "opacity-40")} />                </g>
              )
            })}
          </svg>
        )}
      </div>
    </section>
  )
}
