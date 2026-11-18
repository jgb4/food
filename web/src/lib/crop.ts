export type Area = { x: number; y: number; width: number; height: number }

/** Photos are stored no wider than this. */
const MAX_SIDE = 1280

/** Round a crop area to whole pixels and keep it inside the image. */
export function clampArea(a: Area, imageWidth: number, imageHeight: number): Area {
  const x = Math.min(Math.max(0, Math.round(a.x)), imageWidth - 1)
  const y = Math.min(Math.max(0, Math.round(a.y)), imageHeight - 1)
  const width = Math.max(1, Math.min(imageWidth - x, Math.round(a.width)))
  const height = Math.max(1, Math.min(imageHeight - y, Math.round(a.height)))
  return { x, y, width, height }
}

/** Output size for a crop, scaled down so neither side exceeds MAX_SIDE. */
export function outputSize(area: Area): { width: number; height: number } {
  const k = Math.min(1, MAX_SIDE / Math.max(area.width, area.height))
  return { width: Math.round(area.width * k), height: Math.round(area.height * k) }
}

/** Cut `area` (in the source image's pixels) out of the image at `src` and return it as a JPEG. */
export async function cropToJpeg(src: string, area: Area): Promise<Blob> {
  const bmp = await createImageBitmap(await (await fetch(src)).blob())
  const r = clampArea(area, bmp.width, bmp.height)
  const out = outputSize(r)
  const canvas = document.createElement("canvas")
  canvas.width = out.width
  canvas.height = out.height
  canvas.getContext("2d")!.drawImage(bmp, r.x, r.y, r.width, r.height, 0, 0, out.width, out.height)
  bmp.close()
  const jpeg = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85))
  if (!jpeg) throw new Error("encode failed")
  return jpeg
}
