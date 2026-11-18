import { cn } from "@/lib/utils"

const LOGO = `${import.meta.env.BASE_URL}logo.png`
const mask = `url("${LOGO}") center / contain no-repeat`

/** The restaurant's line drawing (drawn in the text color) above the wordmark. */
export function Brand({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  const lg = size === "lg"
  return (
    <div className={cn("flex flex-col items-center", lg ? "gap-3" : "gap-1", className)}>
      <div
        aria-hidden
        className={cn("bg-foreground", lg ? "w-52" : "w-20")}
        style={{ aspectRatio: "554 / 320", WebkitMask: mask, mask }}
      />
      <span
        className={cn(
          "font-wordmark leading-none font-semibold whitespace-nowrap uppercase tracking-[0.14em] pl-[0.14em]",
          lg ? "text-2xl" : "text-[15px]"
        )}
      >
        Maison Emma
      </span>
    </div>
  )
}
