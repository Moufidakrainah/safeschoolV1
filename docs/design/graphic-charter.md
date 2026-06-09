# Graphic Charter — SafeSchool

> Visual token reference for the project: colors, typography, spacing, radius.
> Source of truth: `frontend/src/index.css` (`@theme`) and shadcn components (`@theme inline`).
> For component strategy: see [`design-system.md`](./design-system.md).

---

## Design process

The SafeSchool interface was developed through an iterative two-phase process.

**Phase 1 — Initial mockups (March 2026):** The mockups in [`design/mockups/`](./design/mockups/) were produced at the start of the project to frame the screen structure and main user flows. They helped identify the key views (report submission, profile, quiz) and informed the component breakdown before development began.

**Phase 2 — Final UI:** As the application took shape, the interface converged toward a design system built on **shadcn/ui** and **Tailwind CSS v4**. The visual rules documented below are the result of that process.

---

## Colors

### Primary colors

| CSS token | Tailwind class | Hex | Contrast / Usage |
|---|---|---|---|
| `--color-primary` | `bg-primary` `text-primary` `border-primary` | `#006278` | 5.0:1 on white — WCAG AA. Navbar, footer, buttons, accents. |
| `--color-primary-hover` | `hover:bg-primary-hover` | `#004f62` | 7.1:1 on white — WCAG AAA. Hover state for primary buttons. |
| `--color-surface` | `bg-surface` | `#ebfcff` | Page background (light background). |

> Technical note: `--color-primary` is controlled via the shadcn variable `--primary` in `:root`.
> To change the brand color, update `--primary` in `frontend/src/index.css`.

### Report severity colors

| CSS token | Tailwind class | Hex | Level |
|---|---|---|---|
| `--color-critical` | `bg-critical` `text-critical` | `#cc0000` | Critical (dark red) |
| `--color-high` | `bg-high` `text-high` | `#ff914d` | High (orange) |
| `--color-medium` | `bg-medium` `text-medium` | `#ffde59` | Medium (yellow) |
| `--color-low` | `bg-low` `text-low` | `#74cc00` | Low (green) |

### shadcn semantic variables

These variables are managed by shadcn/ui in `index.css` and mapped to Tailwind tokens:

| CSS variable | shadcn usage |
|---|---|
| `--primary` | Background for `default` buttons, accents (= `#006278`) |
| `--primary-foreground` | Text on `--primary` (white) |
| `--background` | Default page background |
| `--foreground` | Main text color |
| `--muted` | Muted / dimmed areas |
| `--muted-foreground` | Secondary text |
| `--border` | Borders |
| `--destructive` | Destructive actions (red) |

> Do not modify shadcn variables directly. Use `--primary` to change the brand color.

---

## Typography

| Level | Tailwind class | Usage |
|---|---|---|
| Heading XL | `text-4xl font-black` | Main page titles |
| Heading L | `text-2xl font-bold` | Section titles |
| Heading M | `text-xl font-semibold` | Sub-titles |
| Body | `text-base` | Regular text |
| Secondary | `text-sm text-gray-600` | Descriptions, field hints |
| Caption | `text-xs text-gray-400` | Metadata, labels |
| Code / Token | `font-mono text-sm` | Technical values |

**Primary font:** Geist Variable (loaded via `@fontsource-variable/geist`), fallback `system-ui, Roboto, sans-serif`.

> Legacy values in `frontend/src/styles/theme.ts` (`fontFamily`, `fontSize`) — do not use for new components. Use Tailwind classes instead.

---

## Radius

Radius values defined by shadcn via the variable `--radius: 0.625rem` in `:root`, automatically scaled:

| Tailwind class | Value |
|---|---|
| `rounded-sm` | `calc(var(--radius) * 0.6)` ≈ 4px |
| `rounded-md` | `calc(var(--radius) * 0.8)` ≈ 5px |
| `rounded-lg` | `var(--radius)` = 10px |
| `rounded-xl` | `calc(var(--radius) * 1.4)` ≈ 14px |
| `rounded-2xl` | `calc(var(--radius) * 1.8)` ≈ 18px |
| `rounded-full` | `9999px` |

---

## Spacing

Default Tailwind v4 spacing system (base 4 = 1rem):

| Class | Value | Typical usage |
|---|---|---|
| `gap-1` / `p-1` | 0.25 rem | Micro-spacing (icons) |
| `gap-2` / `p-2` | 0.5 rem | Inline groups |
| `gap-4` / `p-4` | 1 rem | Card padding, grid gap |
| `gap-6` / `p-6` | 1.5 rem | Section padding |
| `gap-8` | 2 rem | Separation between components |
| `gap-10` | 2.5 rem | Separation between page sections |

---

## Shadows

Standard shadow: `shadow-sm` (Tailwind) for cards and panels.
Legacy shadow available in `frontend/src/styles/theme.ts`: `0 2px 10px rgba(0,0,0,0.06)` — not used in new components.

---

## Logo

- Files in `frontend/public/logos/`
- Do not include the logo directly in React components — reference it from `public/` via absolute path `/logos/...`

