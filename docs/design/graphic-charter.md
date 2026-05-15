# Charte graphique — SafeSchool

> Référence des tokens visuels du projet : couleurs, typographie, espacement, radius.  
> Source de vérité : `frontend/src/index.css` (`@theme`) et composants shadcn (`@theme inline`).  
> Pour la stratégie de composants : voir [`design-system.md`](./design-system.md).

---

## Couleurs

### Couleurs principales

| Token CSS | Classe Tailwind | Hex | Contraste / Usage |
|---|---|---|---|
| `--color-primary` | `bg-primary` `text-primary` `border-primary` | `#006278` | 5,0:1 sur blanc — WCAG AA. Navbar, footer, boutons, accents. |
| `--color-primary-hover` | `hover:bg-primary-hover` | `#004f62` | 7,1:1 sur blanc — WCAG AAA. État hover du bouton primary. |
| `--color-surface` | `bg-surface` | `#ebfcff` | Fond des pages (light background). |

> Note technique : `--color-primary` est contrôlé via la variable shadcn `--primary` dans `:root`.  
> Modifier la couleur brand = modifier `--primary` dans `frontend/src/index.css`.

### Sévérité des signalements

| Token CSS | Classe Tailwind | Hex | Niveau |
|---|---|---|---|
| `--color-critical` | `bg-critical` `text-critical` | `#cc0000` | Critique (rouge foncé) |
| `--color-high` | `bg-high` `text-high` | `#ff914d` | Grave (orange) |
| `--color-medium` | `bg-medium` `text-medium` | `#ffde59` | Moyen (jaune) |
| `--color-low` | `bg-low` `text-low` | `#74cc00` | Faible (vert) |

### Variables shadcn (sémantiques)

Ces variables sont gérées par shadcn/ui dans `index.css` et mappées sur les tokens Tailwind :

| Variable CSS | Usage shadcn |
|---|---|
| `--primary` | Fond des boutons `default`, accents (= `#006278`) |
| `--primary-foreground` | Texte sur `--primary` (blanc) |
| `--background` | Fond de page par défaut |
| `--foreground` | Texte principal |
| `--muted` | Zones atténuées |
| `--muted-foreground` | Texte secondaire |
| `--border` | Bordures |
| `--destructive` | Actions destructives (rouge) |

> Ne pas modifier les variables shadcn directement. Passer par `--primary` pour la couleur brand.

---

## Typographie

| Niveau | Classe Tailwind | Usage |
|---|---|---|
| Heading XL | `text-4xl font-black` | Titres de page principaux |
| Heading L | `text-2xl font-bold` | Titres de section |
| Heading M | `text-xl font-semibold` | Sous-titres |
| Corps | `text-base` | Texte courant |
| Secondaire | `text-sm text-gray-600` | Descriptions, champs |
| Légende | `text-xs text-gray-400` | Métadonnées, labels |
| Code/Token | `font-mono text-sm` | Valeurs techniques |

**Police principale :** Geist Variable (chargée via `@fontsource-variable/geist`), fallback `system-ui, Roboto, sans-serif`.

> Valeurs legacy dans `frontend/src/styles/theme.ts` (`fontFamily`, `fontSize`) — à ne plus utiliser pour les nouveaux composants. Utiliser les classes Tailwind à la place.

---

## Radius

Radius définis par shadcn via la variable `--radius: 0.625rem` dans `:root`, déclinée automatiquement :

| Classe Tailwind | Valeur |
|---|---|
| `rounded-sm` | `calc(var(--radius) * 0.6)` ≈ 4px |
| `rounded-md` | `calc(var(--radius) * 0.8)` ≈ 5px |
| `rounded-lg` | `var(--radius)` = 10px |
| `rounded-xl` | `calc(var(--radius) * 1.4)` ≈ 14px |
| `rounded-2xl` | `calc(var(--radius) * 1.8)` ≈ 18px |
| `rounded-full` | `9999px` |

---

## Espacement

Système Tailwind v4 par défaut (base 4 = 1rem) :

| Classe | Valeur | Usage type |
|---|---|---|
| `gap-1` / `p-1` | 0,25 rem | Micro-espacement (icônes) |
| `gap-2` / `p-2` | 0,5 rem | Inline groupes |
| `gap-4` / `p-4` | 1 rem | Padding de carte, gap de grille |
| `gap-6` / `p-6` | 1,5 rem | Padding de section |
| `gap-8` | 2 rem | Séparation entre composants |
| `gap-10` | 2,5 rem | Séparation entre sections de page |

---

## Ombres

Ombre standard : `shadow-sm` (Tailwind) pour les cartes et panneaux.  
Ombre legacy disponible dans `frontend/src/styles/theme.ts` : `0 2px 10px rgba(0,0,0,0.06)` — non utilisée dans les nouveaux composants.

---

## Logo

- Fichiers dans `frontend/public/logos/`
- Ne pas inclure le logo directement dans les composants React — référencer depuis `public/` via chemin absolu `/logos/...`
