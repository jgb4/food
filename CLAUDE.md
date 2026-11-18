# Project Instructions

## UI / Design
- Use shadcn/ui as the default component system.
- Before creating a UI primitive, check whether an appropriate existing component exists.
- Aim for restrained product UI similar in spirit to Linear and Vercel.
- Favor typography, spacing, alignment, and subtle borders over decoration.
- Keep layouts compact.
- Use neutral colors with one accent color.
  - Exception, by the owner's choice: Maison Emma's page background is light pink (#F7E4E6), always, with no dark mode. Keep it; navy (#2F3A5E, the logo's ink) stays the one accent.
- Avoid gradients, glows, oversized radii, decorative icons, and excessive shadows.
- Cards are not the default container. Prefer sections, rows, whitespace, and dividers.
- Deliberately under-design first implementations. Establish hierarchy and usability before adding visual personality.
- Keep the "Select a dish…" / "Select an idea…" hints under the lists: on phones nothing else shows that rows are tappable.

## Engineering
- Reuse existing components before creating new ones.
- Keep changes scoped to the requested task.
- Run relevant tests after changes.
- After each finished change, rebuild (`npm run build` in `web/`), then commit and push to main without asking.
