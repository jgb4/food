# food

Static food sites, served with GitHub Pages.

- [Maison Emma](https://jgb4.github.io/food/maison-emma/): ratings, photos and notes for Emma's weekly dinners, plus future meal ideas. Everyone sees the same entries; adding or changing them needs the house passcode.

## How Maison Emma stores data

`maison-emma/index.html` talks to a Cloudflare Worker (`api/`, deployed as `maison-emma-api`) backed by a D1 database named `maison-emma`. Reads are public; every write must send the passcode, which the worker checks against its `PASSCODE` secret.

From `api/`:

- Deploy changes: `npx wrangler deploy`
- Change the passcode: `npx wrangler secret put PASSCODE`
- Recreate tables: `npx wrangler d1 execute maison-emma --remote --file schema.sql`
