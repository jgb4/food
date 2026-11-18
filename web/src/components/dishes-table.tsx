import { useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePhotoUrl } from "@/hooks/use-maison"
import type { Api } from "@/lib/api"
import { nextSort, sortDishes } from "@/lib/sort"
import type { Dish, Sort, SortKey } from "@/lib/types"
import { mondayOf, weekLabel } from "@/lib/week"
import { cn } from "@/lib/utils"

type Props = {
  api: Api
  dishes: Dish[]
  sort: Sort
  onSortChange: (s: Sort) => void
  onEdit: (d: Dish) => void
}

export function DishesTable({ api, dishes, sort, onSortChange, onEdit }: Props) {
  const [viewing, setViewing] = useState<Dish | null>(null)
  const rows = sortDishes(dishes, sort)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-0"><span className="sr-only">Photo</span></TableHead>
            <SortHead label="Week" col="week" sort={sort} onSortChange={onSortChange} />
            <TableHead>Dish</TableHead>
            <SortHead label="Score" col="score" sort={sort} onSortChange={onSortChange} align="end" />
            <TableHead className="hidden md:table-cell">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((d) => (
            <TableRow
              key={d.id}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => onEdit(d)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(d) } }}
              aria-label={`Edit ${d.name}`}
            >
              <TableCell className="py-2">
                <Thumb api={api} id={d.photo} name={d.name} onOpen={() => setViewing(d)} />
              </TableCell>
              <TableCell className="text-muted-foreground tabular-nums">{weekLabel(mondayOf(d.weekOf))}</TableCell>
              <TableCell className="whitespace-normal">
                <div className="font-medium">{d.name}</div>
                {d.notes && <div className="text-xs font-normal text-muted-foreground md:hidden">{d.notes}</div>}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {d.score}<span className="text-muted-foreground">/10</span>
              </TableCell>
              <TableCell className="hidden max-w-[32ch] whitespace-normal text-muted-foreground md:table-cell">
                {d.notes}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="p-2 sm:max-w-2xl">
          <DialogTitle className="sr-only">{viewing?.name}</DialogTitle>
          {viewing && <FullPhoto api={api} id={viewing.photo} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function SortHead({ label, col, sort, onSortChange, align = "start" }: {
  label: string; col: SortKey; sort: Sort; onSortChange: (s: Sort) => void; align?: "start" | "end"
}) {
  const active = sort.key === col
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead className={cn(align === "end" && "text-right")} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <Button
        variant="ghost"
        size="sm"
        // pull the button's padding into the cell so the label lines up with the column's values
        className={cn("font-medium", align === "end" ? "-mr-2" : "-ml-2", !active && "text-muted-foreground")}
        onClick={() => onSortChange(nextSort(sort, col))}
      >
        {label}
        <Icon className={cn(!active && "opacity-50")} />
      </Button>
    </TableHead>
  )
}

/** 4:3 thumbnails: 64×48 on phones, 112×84 where there's room. */
const THUMB = "h-12 w-16 md:h-21 md:w-28"

function Thumb({ api, id, name, onOpen }: { api: Api; id: string | null; name: string; onOpen: () => void }) {
  const url = usePhotoUrl(api, id)
  if (!id) return <div className={cn(THUMB, "rounded-md bg-muted")} />
  return (
    <button
      type="button"
      className={cn(THUMB, "block overflow-hidden rounded-md bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}
      onClick={(e) => { e.stopPropagation(); onOpen() }}
      onKeyDown={(e) => e.stopPropagation()}
      aria-label={`View photo of ${name}`}
    >
      {url && <img src={url} alt="" className="size-full object-cover" />}
    </button>
  )
}

/** The enlarged photo uses the same 4:3 framing as the thumbnails; the full photo is only shown in the dish form. */
function FullPhoto({ api, id }: { api: Api; id: string | null }) {
  const url = usePhotoUrl(api, id)
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
      {url && <img src={url} alt="" className="size-full object-cover" />}
    </div>
  )
}
