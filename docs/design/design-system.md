# Component System — SafeSchool

> Component organisation strategy, shadcn/ui rules, and install instructions.
> For visual tokens (colors, typography, radius): see [`graphic-charter.md`](./graphic-charter.md).

---

## Two-layer component architecture

```
frontend/src/components/
├── ui/          ← shadcn/ui primitives (generated, Radix-based)
│   ├── button.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── label.tsx
│   ├── separator.tsx
│   ├── avatar.tsx
│   └── tabs.tsx
│
├── Button.tsx   ← Application business components (SafeSchool-specific logic)
├── Badge.tsx
├── Card.tsx
├── ...
├── layout/      ← Layout components (Header, AdminHeader, …)
├── reporter/    ← Components specific to the report submission flow
└── student/     ← Components related to student profiles
```

### `components/ui/` — shadcn/ui primitives

- Code **copied** into the repo via `npx shadcn@latest add <component>` (not an npm dependency).
- Built on **Radix UI**: accessibility, keyboard navigation, and ARIA compliance guaranteed.
- Styled via Tailwind + CSS variables (`--primary`, `--border`, etc. from `index.css`).
- **Do not modify** except to adjust global styles (modify `index.css` instead).
- Documented in the "shadcn/ui primitives" tab of the UI Kit.

### `components/*.tsx` and subdirectories — Application business components

- SafeSchool-specific components: report display logic, severity badges, StatCard, etc.
- Some wrap or coexist with their shadcn equivalents (e.g. `Badge.tsx` vs `components/ui/badge.tsx`).
- Documented in the "App components" tab of the UI Kit.

For the full component inventory, see [`technical/components.md`](../technical/components.md).

---

## Migration rule

| Situation | Action |
|---|---|
| **New feature** | Use shadcn primitives (`components/ui/`) first |
| **Existing app component being modified** | Evaluate whether replacing it with shadcn adds real value (accessibility, consistency) |
| **Existing app component not being touched** | Do not migrate — follow the "only touch what you change" principle |
| **Strong business component** | Keep the app component (e.g. `Badge` with business variants, `StatCard`) even if shadcn has an equivalent |

---

## Installing a new shadcn component

```sh
docker compose exec frontend sh -c "cd /app && npx shadcn@latest add <name>"
```

Full component list: https://ui.shadcn.com/docs/components

---

## Points to watch

- **Name conflicts**: `Badge`, `Card`, `Input`, `Select` exist in both layers (app + shadcn). Imports from `@/components/ui/` target shadcn; relative imports (`../components/Badge`) target app components.
- **Primary color**: Tailwind `bg-primary` uses `var(--primary)` via `@theme inline`. Changing the brand color means changing `--primary` in `:root` in `index.css`.
- **Dark mode**: shadcn variables under `.dark {}` in `index.css`. Not actively enabled — `dark:` suffix is available if needed.

