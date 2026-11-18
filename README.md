# food

Food sites, served with GitHub Pages.

- [Maison Emma](https://jgb4.github.io/food/maison-emma/): ratings, photos and notes for Emma's weekly dinners, plus future meal ideas. Everyone sees the same entries; the site asks for the house passcode when it opens.

Design and engineering rules for this repo are in [CLAUDE.md](CLAUDE.md).

## Layout

- `web/`: the Maison Emma app (Vite, React, TypeScript, Tailwind, shadcn/ui).
- `maison-emma/`: the built app that GitHub Pages serves. Generated; don't edit by hand.
- `api/`: the Cloudflare Worker (`maison-emma-api`) and D1 database (`maison-emma`) that store dishes, ideas and photos.

## Working on the app

From `web/`:

- `npm install` once
- `npm test` runs the unit tests (week math, sorting, API client)
- `npm run dev` starts a dev server; `npm run build && npm run preview` serves the built site on http://localhost:8643/food/maison-emma/ (the only local address the worker accepts)
- `npm run build` typechecks and writes the site into `../maison-emma/`; commit that folder to publish

Add UI pieces with `npx shadcn@4.23.0 add <component>` before writing your own.

## Data rules

Every request to the worker needs the house passcode in the `X-Passcode` header, reads and photos included; the worker checks it against its `PASSCODE` secret. Each week holds at most one dish, stored as that week's Monday.

From `api/`:

- Deploy changes: `npx wrangler deploy`
- Change the passcode: `npx wrangler secret put PASSCODE`
- Recreate tables: `npx wrangler d1 execute maison-emma --remote --file schema.sql`
