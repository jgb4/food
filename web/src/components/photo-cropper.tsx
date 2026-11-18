import { useState } from "react"
import Cropper from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cropToJpeg, type Area } from "@/lib/crop"

/** Same shape as the table thumbnails. */
const ASPECT = 4 / 3

type Props = {
  /** Image to crop (an object URL) */
  src: string
  onApply: (jpeg: Blob) => void
  onCancel: () => void
}

/** Drag the photo to position it and zoom (slider, scroll or pinch) inside a 4:3 frame. */
export function PhotoCropper({ src, onApply, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function apply() {
    if (!area) return
    setBusy(true)
    setError(null)
    try {
      onApply(await cropToJpeg(src, area))
    } catch {
      setError("Couldn't crop that photo. Try again.")
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={ASPECT}
          // the photo fills the 4:3 frame; drag it to choose which part shows
          objectFit="cover"
          minZoom={1}
          maxZoom={4}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Zoom</span>
        <Slider aria-label="Zoom" className="flex-1" min={1} max={4} step={0.01} value={[zoom]} onValueChange={([z]) => setZoom(z)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="button" size="sm" onClick={apply} disabled={busy || !area}>{busy ? "Cropping…" : "Apply crop"}</Button>
      </div>
    </div>
  )
}
