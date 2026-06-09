# Wiki Salvage Plan

> What should be preserved from `docs/_DoNotDeliver/` before the archive is emptied.

This file is a preservation note, not a delivery claim. Its purpose is to keep the useful internal knowledge that should be moved to a personal or team wiki.

---

## Final Decision by Source

| Source | Decision | Why | Target |
|---|---|---|---|
| `manuel-reference-projet.md` | Extract selectively | High pedagogical value, too large and too internal to keep as-is | Wiki pages + a few short factual additions to delivery docs |
| `toweigh.md` | Keep temporarily, then discard | Transitional triage note only | Delete after wiki extraction is done |

---

## Decision by Section

| Section from `manuel-reference-projet.md` | Decision | Why | Suggested target |
|---|---|---|---|
| `Docker — l'infrastructure` | Move to wiki | Very useful for understanding ports, volumes, bind mounts, compose orchestration, and dev workflow; too detailed for delivery | `Wiki / Docker setup and runtime model` |
| `Le Backend — NestJS` | Move to wiki | Good explanatory material on modules, request lifecycle, repositories, and bootstrap flow | `Wiki / NestJS backend architecture` |
| `L'authentification JWT` | Split | Keep the detailed flow in the wiki, but short factual reminders can enrich delivery docs | `Wiki / JWT auth flow` + [docs/Additional/technical/backend.md](../technical/backend.md) |
| `Le Frontend — React + Vite` | Move to wiki | Strong onboarding value on routing, context, API calls, and env handling; too implementation-focused for delivery | `Wiki / React frontend architecture` |
| `Design System — composants et conventions` | Split | The long explanation belongs in the wiki; a short convention reminder may strengthen delivery docs | `Wiki / Design system rules` + [docs/Additional/technical/components.md](../technical/components.md) |
| `Internationalisation — react-i18next` | Move to wiki | Good internal knowledge, but not necessary to expand delivery docs beyond current claims | `Wiki / Internationalization` |
| `Tailwind CSS — le système de classes` | Move to wiki | Useful for frontend montée en puissance, weak value as delivery documentation | `Wiki / Tailwind usage in the project` |
| `Accessibilité — WCAG AA et ARIA` | Discard from delivery, optional wiki | Too risky to claim in delivery unless fully verified; can still help as internal quality notes | Optional `Wiki / Accessibility checks` |
| `Flux complet de A à Z` | Move to wiki | Good oral-prep and systems-understanding content, but too narrative for delivery | `Wiki / End-to-end application flow` |
| `WebSockets — le module Quiz temps réel` | Move to wiki | Delivery doc [docs/Additional/technical/websocket.md](../technical/websocket.md) already covers the livrable scope; the long explanation remains useful internally | `Wiki / Real-time quiz with Socket.io` |
| `Next.js, NestJS, Node.js — les confondre et les distinguer` | Move to wiki | Pure montée en puissance content, not delivery material | `Wiki / JS stack distinctions` |
| `shadcn/ui — ajouter et migrer des composants` | Move to wiki | Very useful for team onboarding and UI maintenance, but internal by nature | `Wiki / shadcn usage and migration` |
| `CORS — autoriser le frontend à parler au backend` | Split | The detailed explanation belongs in the wiki; a short delivery note is justified because it documents a real runtime constraint | `Wiki / CORS in SafeSchool` + [docs/Additional/technical/backend.md](../technical/backend.md) |
| `Validation des formulaires côté frontend` | Move to wiki | Useful internal practice note, but too implementation-specific for delivery docs | `Wiki / Frontend form validation` |

---

## Shortlist of Wiki Pages to Preserve

These are the pages worth creating before deleting the archive:

1. `Docker setup and runtime model`
2. `NestJS backend architecture`
3. `JWT auth flow`
4. `React frontend architecture`
5. `Design system rules`
6. `Internationalization`
7. `Tailwind usage in the project`
8. `End-to-end application flow`
9. `Real-time quiz with Socket.io`
10. `shadcn usage and migration`
11. `CORS in SafeSchool`
12. `Frontend form validation`

Optional pages only if useful for personal montée en puissance:

1. `Accessibility checks`
2. `Next.js vs NestJS vs Node.js`

---

## What Can Still Improve Delivery Docs

Only a few short additions are worth extracting into the delivery documentation:

1. `backend.md`: clarify the role of `main.ts`, `JwtStrategy`, `req.user`, and the reason CORS is required in development.
2. `components.md`: add one short note on the distinction between UI primitives and business components if needed.
3. `websocket.md`: no major missing section identified; keep as-is unless a very short factual clarification is wanted.

Everything else should remain wiki material, not livrable documentation.

---

## Safe Deletion Order

Before deleting `docs/_DoNotDeliver/`:

1. Create or copy the wiki pages listed above.
2. Apply only the short factual additions that are still useful in delivery docs.
3. Remove `toweigh.md` once the extraction is complete.
4. Delete the archive folder only after the useful sections are preserved elsewhere.