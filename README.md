# food

Static food sites, served with GitHub Pages.

- [Maison Emma](https://jgb4.github.io/food/maison-emma/): ratings, photos and notes for Emma's weekly dinners, plus future meal ideas. Everyone sees the same entries; the site asks for the house passcode when it opens.

## How Maison Emma stores data

`maison-emma/index.html` talks to a Cloudflare Worker (`api/`, deployed as `maison-emma-api`) backed by a D1 database named `maison-emma`. Every request, reads included, must send the house passcode, which the worker checks against its `PASSCODE` secret. The page asks for it when it opens. Each week holds at most one dish (stored as that week's Monday).

From `api/`:

- Deploy changes: `npx wrangler deploy`
- Change the passcode: `npx wrangler secret put PASSCODE`
- Recreate tables: `npx wrangler d1 execute maison-emma --remote --file schema.sql`
