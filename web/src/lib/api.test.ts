import { describe, expect, it, vi } from "vitest"
import { API_BASE, ApiError, createApi } from "./api"

const respond = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

describe("createApi", () => {
  it("sends the passcode on reads", async () => {
    const f = vi.fn(async () => respond(200, []))
    await createApi("secret", f).listDishes()
    expect(f).toHaveBeenCalledWith(`${API_BASE}/api/dishes`, expect.objectContaining({ method: "GET", headers: { "X-Passcode": "secret" } }))
  })

  it("sends JSON bodies on writes", async () => {
    const f = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => respond(201, { id: "x" }))
    await createApi("p", f).addDish({ name: "Soup", weekOf: "2026-11-16", score: 7, notes: "", photo: null })
    const init = f.mock.calls[0][1]!
    expect(init.method).toBe("POST")
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
    expect(JSON.parse(init.body as string)).toMatchObject({ name: "Soup", weekOf: "2026-11-16" })
  })

  it("uploads photos as raw image bodies", async () => {
    const f = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => respond(201, { id: "abc" }))
    const jpeg = new Blob(["x"], { type: "image/jpeg" })
    await createApi("p", f).uploadPhoto(jpeg)
    const init = f.mock.calls[0][1]!
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("image/jpeg")
    expect(init.body).toBe(jpeg)
  })

  it("treats 204 as success with no body", async () => {
    await expect(createApi("p", async () => new Response(null, { status: 204 })).deleteDish("a")).resolves.toBeUndefined()
  })

  it("flags a wrong passcode", async () => {
    const err = await createApi("bad", async () => respond(401, { error: "wrong passcode" })).listIdeas().catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.wrongPasscode).toBe(true)
  })

  it("explains a double-booked week", async () => {
    const err = await createApi("p", async () => respond(409, { error: "That week already has a dish." }))
      .addDish({ name: "x", weekOf: "2026-11-16", score: 5, notes: "", photo: null }).catch((e) => e)
    expect(err.message).toMatch(/already has a dish/)
  })

  it("passes through the server's reason for bad input", async () => {
    const err = await createApi("p", async () => respond(400, { error: "Week must be given as its Monday (YYYY-MM-DD)." }))
      .addDish({ name: "x", weekOf: "2026-11-18", score: 5, notes: "", photo: null }).catch((e) => e)
    expect(err.message).toMatch(/Monday/)
  })

  it("reports a network failure plainly", async () => {
    const err = await createApi("p", async () => { throw new TypeError("Failed to fetch") }).listDishes().catch((e) => e)
    expect(err.status).toBe(0)
    expect(err.message).toMatch(/Couldn't reach/)
  })
})
