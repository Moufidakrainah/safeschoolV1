# Migration shadcn/ui — Guide de passation

## C'est quoi shadcn/ui ?

shadcn/ui n'est **pas** une bibliothèque qu'on installe comme un `npm install`. C'est un générateur
qui **copie** des composants dans le projet (`src/components/ui/`). On possède le code source — on
peut le modifier librement.

Les composants reposent sur **Base UI** (`@base-ui/react`) qui gère toute l'accessibilité ARIA
en interne (focus trap, keyboard nav, aria-expanded, etc.).

---

## Composants métier vs composants non-métier

### Non-métier = primitifs génériques

Ce sont des briques interchangeables d'une app à l'autre. Toutes les apps web ont un bouton, un
champ texte, un menu déroulant. shadcn les fournit :

| Composant | Fichier | Usage |
|---|---|---|
| `Button` | `ui/button.tsx` | Tous les boutons de l'app |
| `Input` | `ui/input.tsx` | Champs texte, recherche, date |
| `Textarea` | `ui/textarea.tsx` | Zones de texte multi-lignes |
| `Select` | `ui/select.tsx` | Listes déroulantes |
| `Label` | `ui/label.tsx` | Labels de formulaire |
| `Card` | `ui/card.tsx` | Blocs/panneaux de contenu |
| `Badge` | `ui/badge.tsx` | Étiquettes génériques |
| `Avatar` | `ui/avatar.tsx` | Photo de profil + fallback initiales |
| `Tabs` | `ui/tabs.tsx` | Navigation par onglets |
| `Separator` | `ui/separator.tsx` | Ligne de séparation |

### Métier = composants domaine SafeSchool

Ce sont des composants spécifiques à l'app. Ils **utilisent** les primitifs mais encapsulent une
logique qui n'a de sens que dans SafeSchool :

| Composant | Pourquoi c'est métier |
|---|---|
| `Badge.tsx` (maison) | Variants `new`, `in_progress`, `resolved`, `false_report`… avec i18n et couleurs sémantiques de signalement |
| `Autocomplete.tsx` | Recherche sur le type `UserSearchResult` spécifique à l'API |
| `Pagination.tsx` | Pagination avec résumé i18n (`{totalItems} résultats, page {n}/{total}`) |
| `StepBar.tsx` | Barre de progression pour le formulaire multi-étapes de signalement |
| `StatCard.tsx` | Widget de stat pour le dashboard admin |
| `NoteBlock.tsx` | Bloc de note admin avec type et date |
| `ReportDetail.tsx` | Vue détail d'un signalement |

> **Règle simple** : si le composant pourrait s'utiliser dans n'importe quelle autre app sans
> modification, c'est un primitif → shadcn. S'il parle de signalements, de rôles ou de l'école,
> c'est du métier → on le garde custom.

---

## Ce qui a été migré

### ✅ Terminé

| Fichier | Primitifs migrés |
|---|---|
| `pages/Login.tsx` | Button, Input, Label |
| `pages/AdminDashboard.tsx` | Button, Card, Input, Label, Select, Textarea |
| `components/student/StudentForm.tsx` | Button, Card, Select, Textarea |
| `components/reporter/ReporterForm.tsx` | Button, Card, Select, Textarea |
| `components/student/StudentProfile.tsx` | Card |
| `components/reporter/ReporterProfile.tsx` | Card |
| `pages/Quiz.tsx` | Button, Input |

### ✅ Audits accessibilité effectués

| Composant | Corrections |
|---|---|
| `Autocomplete.tsx` | `useId()` pour IDs uniques, `aria-haspopup="listbox"`, `aria-autocomplete="list"` |
| `Pagination.tsx` | `type="button"` sur tous les boutons |

---

## Ce qui reste à faire — exercice StatsDashboard

`pages/StatsDashboard.tsx` est la seule page qui **ignore complètement** le design system :
- Tout le layout utilise `style={{}}` inline avec des couleurs hardcodées (`#1a1a2e`, `#333`…)
- 3 `<select>` natifs avec styles inline au lieu du composant `Select`
- Aucun token Tailwind, aucun shadcn

**C'est un excellent exercice de migration complète** car cette page concentre tous les cas :
primitifs à remplacer (Select) + design system à appliquer (Tailwind + tokens).

---

## Comment migrer — guide pratique

### Button
```tsx
// Avant
<button className="bg-primary text-white px-4 py-2 rounded-lg">Envoyer</button>

// Après
import { Button } from '../components/ui/button';
<Button>Envoyer</Button>

// Variants disponibles :
<Button variant="default">   // bleu primaire (défaut)
<Button variant="outline">   // contour, fond transparent
<Button variant="ghost">     // transparent, hover discret
<Button variant="success">   // vert (token --success)
<Button variant="destructive"> // rouge
```

### Input
```tsx
// Avant
<input type="text" className="px-4 py-2 border rounded-lg focus:ring-2..." />

// Après
import { Input } from '../components/ui/input';
<Input type="text" />

// type="date", type="search", type="email" etc. fonctionnent normalement
```

### Textarea
```tsx
// Avant
<textarea className="w-full px-4 py-3 border rounded-lg resize-y..." />

// Après
import { Textarea } from '../components/ui/textarea';
<Textarea rows={5} className="resize-y" />
```

### Select
```tsx
// Avant (natif)
<select value={x} onChange={e => setX(e.target.value)}>
  <option value="">Choisir...</option>
  <option value="a">Option A</option>
</select>

// Après (shadcn) — 5 différences clés :
// 1. onChange → onValueChange (reçoit la valeur directement, pas l'event)
// 2. Structure composée obligatoire
// 3. <option> → <SelectItem>
// 4. aria-label → sur SelectTrigger
// 5. placeholder → sur SelectValue, pas dans SelectItem
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

<Select value={x} onValueChange={v => setX(v)}>
  <SelectTrigger aria-label="Choisir une option">
    <SelectValue placeholder="Choisir..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
  </SelectContent>
</Select>
```

### Card
```tsx
// Avant
<div className="bg-white shadow rounded-lg p-6">...</div>

// Après
import { Card } from '../components/ui/card';
<Card className="p-6 shadow-sm">...</Card>
```

---

## Tokens de design (index.css)

Les couleurs du design system sont des variables CSS :

```css
bg-primary          /* bleu SafeSchool */
bg-surface          /* fond gris très clair */
bg-success          /* vert WCAG AA */
bg-warning          /* violet */
bg-destructive      /* rouge */
text-muted-foreground  /* texte secondaire */
```

**Ne jamais utiliser de couleurs hardcodées** (`bg-green-500`, `#1a1a2e`, etc.).
Toujours chercher d'abord si un token existe.

---

## Comprendre la différence : `textarea` vs `Textarea`

`textarea` (minuscule) = balise HTML brute. Le navigateur l'affiche avec son style par défaut :
bordures système, taille, couleur de focus — rien qui correspond au reste de l'interface.

`Textarea` (majuscule) = composant React shadcn. En interne c'est toujours une `<textarea>` HTML,
mais avec les classes du design system déjà appliquées automatiquement (bordures, focus ring,
couleurs). On l'utilise exactement pareil — mêmes props, même comportement — mais elle est
habillée automatiquement.

L'infobulle VS Code qui dit :
```
(alias) function Textarea({ className, ...props }: React.ComponentProps<"textarea">): any
```
signifie exactement ça : la fonction accepte les mêmes props qu'une `<textarea>` HTML standard.
Pas de magie, juste un wrapper stylisé.

**C'est le principe de tous les composants shadcn** : `Input`, `Button`, `Select`… Ce sont des
fonctions React qui wrappent leur équivalent HTML natif avec les styles du projet.

```tsx
// ❌ Avant — HTML brut, style incohérent
<textarea className="px-4 py-2 border rounded-lg..." rows={4} />

// ✅ Après — design system appliqué automatiquement
import { Textarea } from '../components/ui/textarea';
<Textarea rows={4} />
```

---

## Tailwind CSS et le responsive — comprendre `sm:` et `md:`

Tailwind fonctionne en **mobile-first** : sans préfixe, une classe s'applique à tous les écrans,
du plus petit au plus grand. Les préfixes ajoutent une condition "seulement à partir de cette
largeur" :

| Préfixe | Déclenché à partir de | Usage typique |
|---|---|---|
| _(aucun)_ | tous les écrans (mobile inclus) | valeur par défaut |
| `sm:` | 640px | petites tablettes |
| `md:` | 768px | tablettes / desktop |
| `lg:` | 1024px | grands écrans |

**Exemple concret :**

```tsx
// ❌ Avant — 2 colonnes partout, illisible sur mobile (375px)
<div className="grid grid-cols-2 gap-4">

// ✅ Après — 1 colonne sur mobile, 2 colonnes à partir de 768px
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

**`overflow-x-auto`** : classe Tailwind qui autorise le défilement horizontal si le contenu
dépasse le conteneur. Les tableaux HTML ont une largeur intrinsèque qui dépasse facilement
un écran de 375px. Plutôt que de casser le layout, on enveloppe le tableau :

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    ...
  </table>
</div>
```
L'utilisateur peut faire défiler latéralement à l'intérieur de la div sans que le reste de la
page ne soit affecté.
