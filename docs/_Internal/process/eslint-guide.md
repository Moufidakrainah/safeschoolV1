# ESLint

> **Linter** qui analyse le code TypeScript/React sans l'exécuter et signale erreurs de style, variables inutilisées, mauvaises pratiques et bugs potentiels.
> Il est configuré séparément pour le frontend et le backend.

---

## Configurations en place

| Contexte | Fichier de config | Plugins actifs |
|----------|-------------------|---------------|
| Frontend | `frontend/eslint.config.js` | `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` |
| Backend | `backend/eslint.config.mjs` | `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-prettier` |

---

## Lancer ESLint

*Depuis les conteneurs = reproductible*

```bash
# Vérifier le frontend
docker compose exec -T frontend npm run lint

# Vérifier le backend
docker compose exec -T backend npm run lint

# Vérifier frontend et backend
docker compose exec -T frontend npm run lint ; docker compose exec -T backend npm run lint
```

*Sur la machine hôte si node_modules installé localement*

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && npm run lint
```

---

## État du projet (22 mai 2026)

### Frontend — 39 erreurs

| Type d'erreur | Règle ESLint | Fichiers concernés |
|--------------|-------------|-------------------|
| Variable importée ou déclarée mais jamais utilisée | `@typescript-eslint/no-unused-vars` | `AdminDashboard.tsx`, `ConvocationSelector.tsx`, `ReportDetail.tsx`, `StudentForm.tsx`, `Quiz.tsx`, `StatsDashboard.tsx`, `ReporterDashboard.tsx` |
| Utilisation de `any` sans typage précis | `@typescript-eslint/no-explicit-any` | `ConvocationSelector.tsx`, `StudentCases.tsx`, `AdminDashboard.tsx`, `api.ts` |
| `setState` appelé directement dans un `useEffect` | `react-hooks/set-state-in-effect` | `Autocomplete.tsx`, `ReporterDashboard.tsx`, `StudentDashboard.tsx` |
| Export d'une constante dans un fichier de composant (problème HMR) | `react-refresh/only-export-components` | `badge.tsx`, `button.tsx`, `tabs.tsx`, `AuthContext.tsx` |
| Type `{}` vide interdit | `@typescript-eslint/no-empty-object-type` | `_template.tsx` |

### Backend — 75 erreurs, 10 warnings

| Type d'erreur | Règle ESLint | Cause principale |
|--------------|-------------|-----------------|
| Accès à `.user` sur une valeur `any` | `@typescript-eslint/no-unsafe-member-access` | `request.user` non typé dans les controllers (Passport injecte l'utilisateur mais TypeScript ne le sait pas) |
| Assignation de valeur `any` | `@typescript-eslint/no-unsafe-assignment` | Plusieurs services et controllers |
| Promesse non gérée | `@typescript-eslint/no-floating-promises` | `main.ts`, `quiz-realtime.gateway.ts` |
| Expression `unknown` dans un template literal | `@typescript-eslint/restrict-template-expressions` | `logger.service.ts` |
| Variable assignée mais jamais utilisée | `@typescript-eslint/no-unused-vars` | `reports.service.ts` |

---

## Comprendre les erreurs les plus courantes

### `no-unused-vars` — variable déclarée mais jamais utilisée

```ts
// ❌ ESLint signale 'saving' : assigné mais jamais lu
const [saving, setSaving] = useState(false);

// ✅ Soit l'utiliser, soit le supprimer si c'est du code mort
```

### `no-explicit-any` — utilisation de `any`

```ts
// ❌ any désactive toutes les vérifications TypeScript
function process(data: any) { ... }

// ✅ Utiliser un type précis ou unknown
function process(data: unknown) { ... }
```

### `react-hooks/set-state-in-effect` — setState directement dans useEffect

```ts
// ❌ Déclenche un render supplémentaire inutile
useEffect(() => {
  setIsOpen(suggestions.length > 0); // setState synchrone dans useEffect
}, [suggestions]);

// ✅ Calculer dans le render directement si possible
const isOpen = suggestions.length > 0; // pas besoin d'état séparé
```

### `no-unsafe-member-access` sur `request.user` (backend)

```ts
// ❌ Passport injecte req.user mais TypeScript ne connaît pas son type
@Get('me')
getMe(@Req() req: any) { // any pour éviter l'erreur → mais ESLint se plaint
  return req.user;
}

// ✅ Déclarer une interface pour le user JWT et l'utiliser
interface JwtUser { id: string; email: string; role: string; }

@Get('me')
getMe(@Req() req: Request & { user: JwtUser }) {
  return req.user; // typé proprement
}
```

### `no-floating-promises` — promesse non gérée

```ts
// ❌ Si app.listen() rejette, l'erreur est silencieuse
app.listen(3000);

// ✅ Gérer le rejet explicitement
await app.listen(3000);
// ou
app.listen(3000).catch(err => console.error(err));
// ou (pour dire explicitement "je sais que c'est une promesse et je l'ignore")
void app.listen(3000);
```

---

