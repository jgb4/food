// Maison Emma API (Cloudflare Worker + D1).
//
// Reads are public. Every write needs the house passcode in the
// X-Passcode header; it is compared with the PASSCODE secret
// (set with: npx wrangler secret put PASSCODE).
//
//   GET    /api/dishes            list dishes
//   POST   /api/dishes            add a dish
//   PATCH  /api/dishes/:id        change a dish
//   DELETE /api/dishes/:id        delete a dish (and its photo)
//   GET    /api/ideas  POST /api/ideas  PATCH/DELETE /api/ideas/:id
//   POST   /api/photos            upload an image (raw body) -> {id}
//   DELETE /api/photos/:id
//   GET    /photos/:id            the image itself
//   POST   /api/check             200 if the passcode is right

const ALLOWED_ORIGINS = ["https://jgb4.github.io", "http://localhost:8643"];
const MAX_PHOTO = 1_900_000; // D1 rows top out at 2 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const cors = (req) => {
  const o = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Passcode",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};
const json = (req, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors(req) } });
const fail = (req, status, error) => json(req, { error }, status);
const uid = () => crypto.randomUUID().replace(/-/g, "");
const ID = /^[0-9a-f]{32}$/;

async function passcodeOk(req, env) {
  const given = new TextEncoder().encode(req.headers.get("X-Passcode") || "");
  const want = new TextEncoder().encode(env.PASSCODE || "");
  if (!want.length) return false;
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", given), crypto.subtle.digest("SHA-256", want)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

// ---------- validation
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
function cleanDish(d) {
  const name = str(d.name, 120);
  const weekOf = str(d.weekOf, 10);
  const score = Number(d.score);
  if (!name) throw "Dish name is required.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekOf)) throw "Week must be a date (YYYY-MM-DD).";
  if (!(score >= 0 && score <= 10)) throw "Score must be between 0 and 10.";
  const photo = d.photo == null || d.photo === "" ? null : String(d.photo);
  if (photo && !ID.test(photo)) throw "Bad photo id.";
  return { name, weekOf, score: Math.round(score * 2) / 2, notes: str(d.notes, 5000), photo };
}
function cleanIdea(d) {
  const name = str(d.name, 120);
  if (!name) throw "Idea name is required.";
  return { name, notes: str(d.notes, 5000) };
}

const dishOut = (r) => ({ id: r.id, name: r.name, weekOf: r.week_of, score: r.score, notes: r.notes, photo: r.photo, createdAt: r.created_at, updatedAt: r.updated_at });
const ideaOut = (r) => ({ id: r.id, name: r.name, notes: r.notes, createdAt: r.created_at });

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const db = env.DB;

    try {
      // ---------- public reads
      if (req.method === "GET") {
        if (parts[0] === "photos" && ID.test(parts[1] || "")) {
          const row = await db.prepare("select type, data from photos where id = ?").bind(parts[1]).first();
          if (!row) return new Response("Not found", { status: 404, headers: cors(req) });
          return new Response(new Uint8Array(row.data), {
            headers: { "Content-Type": row.type, "Cache-Control": "public, max-age=31536000, immutable", ...cors(req) },
          });
        }
        if (parts[0] === "api" && parts[1] === "dishes" && parts.length === 2) {
          const { results } = await db.prepare("select * from dishes").all();
          return json(req, results.map(dishOut));
        }
        if (parts[0] === "api" && parts[1] === "ideas" && parts.length === 2) {
          const { results } = await db.prepare("select * from ideas").all();
          return json(req, results.map(ideaOut));
        }
        if (parts.length === 0) return json(req, { app: "maison-emma-api", ok: true });
        return fail(req, 404, "Not found");
      }

      // ---------- everything else is a write: passcode first
      if (parts[0] !== "api") return fail(req, 404, "Not found");
      if (!(await passcodeOk(req, env))) {
        await new Promise((r) => setTimeout(r, 500)); // slows down guessing
        return fail(req, 401, "wrong passcode");
      }
      const [, kind, id] = parts;
      const now = Date.now();

      if (kind === "check" && req.method === "POST") return json(req, { ok: true });

      if (kind === "photos") {
        if (req.method === "POST" && !id) {
          const type = (req.headers.get("Content-Type") || "").split(";")[0];
          if (!IMAGE_TYPES.includes(type)) return fail(req, 415, "Photos must be JPEG, PNG, WebP or GIF.");
          const buf = await req.arrayBuffer();
          if (buf.byteLength > MAX_PHOTO) return fail(req, 413, "too_large");
          const pid = uid();
          await db.prepare("insert into photos (id, type, data, created_at) values (?, ?, ?, ?)").bind(pid, type, buf, now).run();
          return json(req, { id: pid, url: "/photos/" + pid }, 201);
        }
        if (req.method === "DELETE" && ID.test(id || "")) {
          await db.prepare("delete from photos where id = ?").bind(id).run();
          return new Response(null, { status: 204, headers: cors(req) });
        }
      }

      if (kind === "dishes") {
        if (req.method === "POST" && !id) {
          const d = cleanDish(await req.json());
          const did = uid();
          await db.prepare("insert into dishes (id, name, week_of, score, notes, photo, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?)")
            .bind(did, d.name, d.weekOf, d.score, d.notes, d.photo, now, now).run();
          return json(req, { id: did, ...d, createdAt: now, updatedAt: now }, 201);
        }
        if (ID.test(id || "")) {
          const cur = await db.prepare("select * from dishes where id = ?").bind(id).first();
          if (!cur) return fail(req, 404, "That dish no longer exists.");
          if (req.method === "PATCH") {
            const d = cleanDish({ ...dishOut(cur), ...(await req.json()) });
            await db.prepare("update dishes set name = ?, week_of = ?, score = ?, notes = ?, photo = ?, updated_at = ? where id = ?")
              .bind(d.name, d.weekOf, d.score, d.notes, d.photo, now, id).run();
            return json(req, { id, ...d, createdAt: cur.created_at, updatedAt: now });
          }
          if (req.method === "DELETE") {
            await db.batch([
              db.prepare("delete from dishes where id = ?").bind(id),
              db.prepare("delete from photos where id = ?").bind(cur.photo || ""),
            ]);
            return new Response(null, { status: 204, headers: cors(req) });
          }
        }
      }

      if (kind === "ideas") {
        if (req.method === "POST" && !id) {
          const d = cleanIdea(await req.json());
          const iid = uid();
          await db.prepare("insert into ideas (id, name, notes, created_at) values (?, ?, ?, ?)").bind(iid, d.name, d.notes, now).run();
          return json(req, { id: iid, ...d, createdAt: now }, 201);
        }
        if (ID.test(id || "")) {
          if (req.method === "PATCH") {
            const cur = await db.prepare("select * from ideas where id = ?").bind(id).first();
            if (!cur) return fail(req, 404, "That idea no longer exists.");
            const d = cleanIdea({ ...ideaOut(cur), ...(await req.json()) });
            await db.prepare("update ideas set name = ?, notes = ? where id = ?").bind(d.name, d.notes, id).run();
            return json(req, { id, ...d, createdAt: cur.created_at });
          }
          if (req.method === "DELETE") {
            await db.prepare("delete from ideas where id = ?").bind(id).run();
            return new Response(null, { status: 204, headers: cors(req) });
          }
        }
      }

      return fail(req, 404, "Not found");
    } catch (e) {
      if (typeof e === "string") return fail(req, 400, e);
      if (e instanceof SyntaxError) return fail(req, 400, "Request body must be JSON.");
      console.error(e);
      return fail(req, 500, "Something went wrong on the server.");
    }
  },
};
