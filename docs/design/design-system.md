# Component System — SafeSchool

> Component organisation strategy, shadcn/ui usage guidelines, and install instructions.
> For visual tokens (colors, typography, radius): see [`graphic-charter.md`](./graphic-charter.md).

---

## Two-layer component architecture

```
frontend/src/components/
├── ui/                    ← shadcn/ui primitives (generated, Radix-based)
│   ├── button.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── label.tsx
│   ├── checkbox.tsx
│   ├── textarea.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── avatar.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── alert-dialog.tsx
│   └── pagination.tsx
│
├── ConvocationSelector.tsx
├── NoteBlock.tsx
├── Pagination.tsx
├── StatCard.tsx
├── StepBar.tsx
│
├── admin/                 ← feature-specific components
│   ├── AdminClasses.tsx
│   ├── AdminUsersList.tsx
│   ├── AdminUserProfile.tsx
│   ├── ReportDetail.tsx
│   ├── StatsDashboard.tsx
│   └── ParentFormItem.tsx
├── layout/                ← navigation structure
│   ├── Header/
│   ├── AdminHeader/
│   ├── ReporterHeader/
│   ├── StudentHeader/
│   └── Footer/
├── reporter/
│   ├── ReporterForm.tsx
│   └── ReporterProfile.tsx
└── student/
    ├── StudentProfile.tsx
    ├── StudentForm.tsx
    └── StudentCases.tsx
```

### `components/ui/` — shadcn/ui primitives

- Copied into the project via `npx shadcn@latest add <component>` — **owned code**, not an npm dependency.
- Built on **Radix UI**: keyboard navigation, focus management, and ARIA compliance out of the box.
- Styled through Tailwind + CSS variables (`--primary`, `--border`, etc. defined in `index.css`).
- Do not modify these files directly — adjust `index.css` to change global appearance.

### Application components

Generic utilities (`StatCard`, `NoteBlock`, `StepBar`, `Autocomplete`, `Pagination`, `ConvocationSelector`) are shared across features and sit at the top level. Feature-specific components live under `admin/`, `reporter/`, `student/`, and `layout/`.

The boundary is simple: if a component could exist in another product without knowing about reports, roles, or the quiz, it belongs in `components/ui/`. If it encodes SafeSchool-specific behavior or vocabulary, it belongs in the application layer.

For the full component inventory, see [`technical/components.md`](../technical/components.md).

---

## Which layer to use

| Situation | Decision |
|---|---|
| **New UI element** | Start with a shadcn primitive from `components/ui/` |
| **SafeSchool-specific behavior or state** | Build an application component on top |
| **Feature logic confined to one area** | Place it under the relevant subdirectory (`admin/`, `reporter/`, etc.) |
| **Reusable across several pages or roles** | Keep it at the top level of `components/` |

---

## Installing a new shadcn component

```sh
docker compose exec frontend sh -c "cd /app && npx shadcn@latest add <name>"
```

Full component list: https://ui.shadcn.com/docs/components

---

## Points to watch

- **Name overlap**: `Badge`, `Card`, `Input`, `Select`, `Pagination` exist in both layers. Imports from `@/components/ui/` target the shadcn version; relative imports target the application version.
- **Brand color**: `bg-primary` uses `var(--primary)` via `@theme inline`. To change the brand color, update `--primary` in `:root` inside `index.css`.
- **Dark mode**: shadcn variables under `.dark {}` in `index.css`. Not currently activated — the `dark:` suffix is available if needed.


