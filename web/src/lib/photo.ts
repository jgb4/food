// Turn whatever the user picked into a JPEG no larger than 1280px.
// iPhone HEIC photos: Safari decodes them itself; other browsers load heic-to
// (current libheif, so 10-bit/HDR photos keep their colors) only when needed.

const MAX_SIDE = 1280

export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch {
    if (!isHeic(file)) throw new Error("unreadable")
    const { heicTo } = await import("heic-to")
    return heicTo({ blob: file, type: "bitmap" })
  }
}

export async function preparePhoto(file: File): Promise<Blob> {
  const bmp = await decode(file)
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bmp.width * k)
  canvas.height = Math.round(bmp.height * k)
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82))
  if (!jpeg) throw new Error("encode failed")
  return jpeg
}
