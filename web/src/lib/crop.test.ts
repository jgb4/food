import { describe, expect, it } from "vitest"
import { clampArea, outputSize } from "./crop"

describe("clampArea", () => {
  it("rounds to whole pixels", () => {
    expect(clampArea({ x: 10.4, y: 20.6, width: 400.5, height: 300.2 }, 1280, 960)).toEqual({ x: 10, y: 21, width: 401, height: 300 })
  })
  it("keeps the area inside the image", () => {
    expect(clampArea({ x: -5, y: -3, width: 2000, height: 2000 }, 1280, 960)).toEqual({ x: 0, y: 0, width: 1280, height: 960 })
    expect(clampArea({ x: 1200, y: 900, width: 400, height: 300 }, 1280, 960)).toEqual({ x: 1200, y: 900, width: 80, height: 60 })
  })
  it("never returns an empty area", () => {
    const r = clampArea({ x: 5000, y: 5000, width: 0, height: 0 }, 100, 100)
    expect(r.width).toBeGreaterThan(0)
    expect(r.height).toBeGreaterThan(0)
  })
})

describe("outputSize", () => {
  it("keeps small crops at full size", () => {
    expect(outputSize({ x: 0, y: 0, width: 800, height: 600 })).toEqual({ width: 800, height: 600 })
  })
  it("scales large crops down to 1280 on the long side, keeping 4:3", () => {
    expect(outputSize({ x: 0, y: 0, width: 2560, height: 1920 })).toEqual({ width: 1280, height: 960 })
  })
})
