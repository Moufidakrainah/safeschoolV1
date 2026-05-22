# Système de composants — SafeSchool

> Stratégie d'organisation des composants React, règles de migration vers shadcn/ui, et inventaire.  
> Pour les tokens visuels (couleurs, typo, radius) : voir [`graphic-charter.md`](./graphic-charter.md).

---

## Deux couches de composants

```
frontend/src/components/
├── ui/          ← Primitives shadcn/ui (générées, basées sur Radix)
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
├── Button.tsx   ← Composants app métier (wrappent la logique SafeSchool)
├── Badge.tsx
├── Card.tsx
├── ...
├── layout/      ← Composants de mise en page (Header, AdminHeader, ...)
├── reporter/    ← Composants spécifiques au flux de signalement
└── student/     ← Composants liés aux profils élèves
```

### `components/ui/` — Primitives shadcn/ui

- Code **copié** dans le repo par `npx shadcn@latest add <composant>` (pas une dépendance npm).
- Construits sur **Radix UI** : accessibilité, navigation clavier, ARIA garantis.
- Stylés via Tailwind + variables CSS (`--primary`, `--border`, etc. depuis `index.css`).
- À **ne pas modifier** sauf pour ajuster le style global (modifier `index.css` à la place).
- Documentés dans l'onglet "shadcn/ui primitives" du [UI Kit](/uikit).

### `components/*.tsx` et sous-dossiers — Composants app métier

- Composants spécifiques à SafeSchool : logique d'affichage des signalements, badges de sévérité, StatCard, etc.
- Certains wrappent ou coexistent avec leurs équivalents shadcn (ex : `Badge.tsx` vs `components/ui/badge.tsx`).
- Documentés dans l'onglet "Composants app" du [UI Kit](/uikit).

---

## Règle de migration

| Situation | Action |
|---|---|
| **Nouvelle feature** | Utiliser les primitives shadcn (`components/ui/`) en priorité |
| **Composant app existant touché** | Évaluer si le remplacer par shadcn apporte une valeur réelle (accessibilité, cohérence) |
| **Composant app existant non touché** | Ne pas migrer — principe "ne toucher que ce qu'on modifie" |
| **Composant métier fort** | Garder le composant app (ex : `Badge` avec variants métier, `StatCard`) même si shadcn a un équivalent |

---

## Composants shadcn installés

| Composant | Fichier | Primitives Radix | Usage principal |
|---|---|---|---|
| Button | `ui/button.tsx` | — | Boutons génériques, actions dans Cards |
| Badge | `ui/badge.tsx` | — | Labels statut sémantique shadcn |
| Input | `ui/input.tsx` | — | Champs de formulaire basiques |
| Label | `ui/label.tsx` | `@radix-ui/react-label` | Label accessible pour champs |
| Select | `ui/select.tsx` | `@radix-ui/react-select` | Listes déroulantes accessibles |
| Card | `ui/card.tsx` | — | Conteneurs visuels avec Header/Content |
| Separator | `ui/separator.tsx` | `@radix-ui/react-separator` | Séparateurs horizontaux/verticaux |
| Avatar | `ui/avatar.tsx` | `@radix-ui/react-avatar` | Avatars avec fallback initiales |
| Tabs | `ui/tabs.tsx` | `@radix-ui/react-tabs` | Navigation par onglets |

### Installer un nouveau composant

```sh
docker compose exec frontend sh -c "cd /app && npx shadcn@latest add <nom>"
```

Liste disponible : https://ui.shadcn.com/docs/components

---

## Composants app métier

| Composant | Fichier | Description |
|---|---|---|
| AppButton | `Button.tsx` | Bouton avec variants métier (primary, danger, warning, success, login…) |
| AppBadge | `Badge.tsx` | Badge avec variants sévérité (critical/high/medium/low) et statut (pending/closed…) |
| AppCard | `Card.tsx` | Carte blanche avec bordure gauche colorée optionnelle |
| AppInput | `Input.tsx` | Champ texte avec label intégré, themes dark/light |
| AppSelect | `Select.tsx` | Select natif stylé |
| StatCard | `StatCard.tsx` | Carte statistique avec couleur et état actif |
| NoteBlock | `NoteBlock.tsx` | Bloc de note / convocation administrative |
| StepBar | `StepBar.tsx` | Barre de progression multi-étapes |
| Pagination | `Pagination.tsx` | Contrôles de pagination |
| Autocomplete | `Autocomplete.tsx` | Champ texte avec suggestions utilisateurs |
| Header | `Header.tsx` | Navigation principale (tous rôles) |
| AdminHeader | `layout/AdminHeader/` | Navigation admin avec sections |
| Footer | `Footer.tsx` | Pied de page |

---

## Points d'attention

- **Conflits de noms** : `Badge`, `Card`, `Input`, `Select` existent en double (app + shadcn). Les imports depuis `@/components/ui/` visent shadcn, les imports relatifs (`../components/Badge`) visent les composants app.
- **Couleur primary** : Tailwind `bg-primary` utilise `var(--primary)` via `@theme inline`. Changer la couleur brand = changer `--primary` dans `:root` dans `index.css`.
- **Dark mode** : Variables shadcn dans `.dark {}` dans `index.css`. Non activé activement — suffixe `dark:` disponible si besoin.
