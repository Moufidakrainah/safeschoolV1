# Reusable Components — Design System

SafeSchool's frontend is built around a two-layer component system: primitive UI components provided by shadcn/ui (Radix-based), and application-specific components that encapsulate SafeSchool's business logic and visual conventions.

The module requires a minimum of 10 reusable components with a consistent design system. Both layers together exceed that threshold.

---

## Layer 1 — shadcn/ui Primitives (`components/ui/`)

These components are copied into the project via `npx shadcn@latest add <component>` — they are not a runtime dependency but owned code. They are built on **Radix UI**, which provides keyboard navigation, focus management, and ARIA compliance out of the box.

| Component | File | Radix primitive | Usage in SafeSchool |
|---|---|---|---|
| Button | `ui/button.tsx` | — | Generic action buttons, form submits, icon buttons |
| Badge | `ui/badge.tsx` | — | Semantic status labels |
| Input | `ui/input.tsx` | — | Basic text form fields |
| Label | `ui/label.tsx` | `@radix-ui/react-label` | Accessible labels for form fields |
| Select | `ui/select.tsx` | `@radix-ui/react-select` | Accessible dropdown selectors |
| Card | `ui/card.tsx` | — | Content containers with Header / Content / Footer slots |
| Separator | `ui/separator.tsx` | `@radix-ui/react-separator` | Horizontal and vertical visual dividers |
| Avatar | `ui/avatar.tsx` | `@radix-ui/react-avatar` | User profile pictures with initials fallback |
| Tabs | `ui/tabs.tsx` | `@radix-ui/react-tabs` | Tabbed navigation panels |

---

## Layer 2 — Application Components (`components/`)

Application-specific components built for SafeSchool's domain. They wrap or extend shadcn primitives where appropriate, and implement SafeSchool-specific variants and behavior.

The practical rule is simple: if a component could be reused in another product without knowing anything about reports, roles, or quiz flows, it belongs in `components/ui/`. If it encodes SafeSchool-specific vocabulary, states, or workflows, it belongs in the application layer.

| Component | File | Description |
|---|---|---|
| AppButton | `Button.tsx` | Extended button with application variants: `primary`, `danger`, `warning`, `success`, `login` |
| AppBadge | `Badge.tsx` | Badge with severity variants (`critical` / `high` / `medium` / `low`) and report status variants (`pending` / `in_progress` / `closed` / …) |
| AppCard | `Card.tsx` | White card with optional colored left border accent, used for report summaries and dashboard panels |
| AppInput | `Input.tsx` | Text field with integrated label and light/dark theme variants |
| AppSelect | `Select.tsx` | Styled native select for role and status filter controls |
| StatCard | `StatCard.tsx` | Statistics card showing a numeric metric with a color accent and active state |
| NoteBlock | `NoteBlock.tsx` | Administrative note or convocation block with author name and timestamp |
| StepBar | `StepBar.tsx` | Multi-step progress bar for the report submission flow |
| Pagination | `Pagination.tsx` | Page navigation controls for paginated lists (reports, users) |

---

## Design Token Conventions

All components consume tokens defined in `frontend/src/index.css`:

- **Colors**: `--color-primary`, `--color-critical/high/medium/low`, `--color-surface` — see [`design/graphic-charter.md`](../design/graphic-charter.md)
- **Typography**: Geist Variable font, Tailwind utility classes (`text-4xl font-black`, `text-sm text-gray-600`, etc.)
- **Radius**: controlled by shadcn variable `--radius: 0.625rem`, applied via `rounded-sm/md/lg/xl`

Full visual specification: [`design/graphic-charter.md`](../design/graphic-charter.md)

---

## Import Convention

shadcn primitives are imported from `@/components/ui/`:
```tsx
import { Button } from '@/components/ui/button'
```

Application components are imported by relative path:
```tsx
import AppBadge from '../components/Badge'
```

Both `Badge` and `Card` and `Input` and `Select` exist in both layers. The import path determines which version is used.

This separation keeps the design system maintainable: primitives stay generic and stable, while business components are free to evolve with the product rules without polluting the reusable base layer.

---

## Additional Frontend Libraries

| Library | Packages | Usage |
|---|---|---|
| **Internationalisation** | `i18next` · `react-i18next` · `i18next-browser-languagedetector` | Three languages (fr / en / de) in `src/i18n/`. Language is detected automatically from the browser. Hook `useTranslation()` used in each component. |
| **Charts** | `recharts` | Declarative chart components (`<BarChart>`, `<LineChart>`, etc.) used in `StatsDashboard.tsx`. |
