# Concepts React — référence équipe

> Ce document explique les concepts React utilisés dans ce projet. Chaque section donne un exemple concret tiré du code SafeSchool.

---

## Composant vs Hook — quelle différence ?

La distinction de base avant de lire le reste.

### Composant — retourne de l'UI

```tsx
function UserCard({ name }: { name: string }) {
  return <div className="card">{name}</div>; // ← retourne du JSX
}
```

- Nom en **PascalCase** (`UserCard`, `StatsDashboard`)
- Retourne toujours du JSX
- Utilisé dans le JSX : `<UserCard name="Lotfi" />`
- Peut appeler des hooks

### Hook — retourne de la logique

```tsx
function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  // ...
  return { reports, loading, fetchReports }; // ← retourne des données/fonctions, pas du JSX
}
```

- Nom commençant par **`use`** (`useReports`, `useAuth`)
- Ne retourne jamais de JSX
- Appelé dans le corps d'un composant ou d'un autre hook : `const { reports } = useReports()`
- Peut appeler d'autres hooks

### Tableau récapitulatif

| | Composant | Hook |
|---|---|---|
| Nommage | PascalCase | useXxx |
| Retourne | JSX | données / fonctions |
| Utilisé comme | `<Composant />` | `const x = useXxx()` |
| Peut appeler des hooks | ✅ | ✅ |
| Peut retourner du JSX | ✅ | ❌ |

### Quand extraire un hook custom

Si un composant dépasse ~150 lignes, c'est souvent parce que la logique (fetch, état, handlers) devrait être dans un hook. Le composant ne garde que le JSX.

```tsx
// Avant — logique et UI mélangées (difficile à lire, pas réutilisable)
function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchReports().then(setReports).finally(...) }, []);
  const handleDelete = async (id) => { ... setReports(...) };
  return <div>...</div>;
}

// Après — logique dans le hook, composant lisible
function AdminDashboard() {
  const { reports, loading, handleDelete } = useReports(); // logique déléguée
  return <div>...</div>;
}
```

---

## TSX / JSX — pourquoi on voit du "HTML" dans du TypeScript

Un fichier `.tsx` est un fichier TypeScript qui contient du **JSX**. JSX est une syntaxe qui ressemble à du HTML, mais ce n'est pas du HTML exécuté tel quel par le navigateur.

Exemple :

```tsx
export default function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
```

Ce code mélange :

- des balises qui ressemblent à du HTML (`<div>`, `<strong>`, `<span>`)
- des expressions JavaScript / TypeScript injectées avec des accolades (`{value}`, `{label}`)

Avant d'arriver au navigateur, Vite + TypeScript transforment ce JSX en appels JavaScript que React sait interpréter pour construire l'interface. L'idée importante est donc : **le JSX est une écriture pratique pour décrire l'UI, pas un deuxième langage exécuté brut dans le navigateur**.

Repère pratique :

- `.ts` = TypeScript sans JSX
- `.tsx` = TypeScript avec JSX

---

## `useMemo` — mémoïser un calcul coûteux

Quand un calcul est long (filtrer des signalements, calculer des stats), `useMemo` évite de le refaire à chaque render — seulement quand les dépendances changent.

```ts
// AVANT — recalculé à chaque frappe dans un input, même si reports n'a pas changé
const filtered = reports.filter(r => r.grade === filterGrade && r.status === filterStatus);

// APRÈS — recalculé seulement si reports ou les filtres changent
const filtered = useMemo(
  () => reports.filter(r => r.grade === filterGrade && r.status === filterStatus),
  [reports, filterGrade, filterStatus]
);
```

**Règle pratique** : si la valeur vient d'un `.filter()`, `.map()`, `.reduce()` ou d'un calcul avec plusieurs conditions, c'est un candidat à `useMemo`.

---

## `useCallback` — mémoïser une fonction

`useCallback` est le pendant de `useMemo` pour les fonctions. Sans lui, une fonction déclarée dans un composant est recréée à chaque render — ce qui peut casser la mémoïsation des composants enfants.

```ts
// AVANT — handleDelete est recréée à chaque render
const handleDelete = async (id: string) => {
  await deleteUser(id);
  setUsers(prev => prev.filter(u => u.id !== id));
};

// APRÈS — stable entre les renders si setUsers ne change pas
const handleDelete = useCallback(async (id: string) => {
  await deleteUser(id);
  setUsers(prev => prev.filter(u => u.id !== id));
}, []); // dépendances vides car setUsers est stable (fourni par useState)
```

**Quand l'utiliser** : quand une fonction est passée en prop à un composant enfant mémoïsé (`React.memo`), ou comme dépendance d'un `useEffect`.

---

## `useEffect` — gérer les effets de bord

`useEffect` sert à déclencher du code après que React a rendu le composant : appels API, abonnements WebSocket, manipulation du DOM.

```ts
// Charger les données au montage du composant
useEffect(() => {
  fetchReports(); // appelé une seule fois au montage
}, []); // tableau vide = "exécuter une seule fois"

// Réagir à un changement
useEffect(() => {
  if (selected) loadNotes(selected.id);
}, [selected]); // s'exécute chaque fois que selected change

// Nettoyage — important pour les WebSockets, timers, abonnements
useEffect(() => {
  const socket = io(SOCKET_URL);
  socket.on('question', handleQuestion);

  return () => {
    socket.disconnect(); // nettoyage au démontage du composant
  };
}, []);
```

**Piège fréquent** : oublier le tableau de dépendances (ou mettre les mauvaises dépendances) provoque soit une boucle infinie, soit un comportement figé avec des données périmées.

---

## `useRef` — référence stable sans re-render

`useRef` crée une boîte qui persiste entre les renders **sans déclencher de re-render** quand elle change. Utilisé pour : garder une référence au socket WebSocket, un timer, ou accéder directement à un élément DOM.

```ts
// Référence à un socket WebSocket (Quiz.tsx)
const socketRef = useRef<Socket | null>(null);

useEffect(() => {
  socketRef.current = io(SOCKET_URL);
  return () => { socketRef.current?.disconnect(); };
}, []);

// Plus loin dans le code — accéder au socket sans le mettre dans useState
socketRef.current?.emit('joinRoom', { roomId });
```

**Différence avec `useState`** : `useState` déclenche un re-render quand la valeur change. `useRef` ne déclenche jamais de re-render — c'est une variable qui "survit" entre les renders.

---

## `useContext` — partager de l'état sans prop drilling

`useContext` permet d'accéder à un état partagé (comme `AuthContext`) depuis n'importe quel composant de l'arbre, sans passer des props à chaque niveau intermédiaire.

```ts
// context/AuthContext.tsx — définition du contexte
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook d'accès
export function useAuth() {
  return useContext(AuthContext)!;
}

// Usage dans n'importe quel composant enfant
const { user, logoutUser } = useAuth(); // pas de prop drilling
```

Dans ce projet : `AuthContext` est déjà bien conçu et utilisé partout. Sert de modèle si vous devez créer un autre contexte (ex. contexte de notifications globales).

---

## Custom Hook — isoler la logique d'un composant

Un custom hook est une fonction qui commence par `use` et qui peut appeler d'autres hooks. Il extrait la logique d'un composant dans un fichier séparé pour le rendre testable et réutilisable.

```ts
// hooks/useReports.ts — logique extraite du composant
export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllReports();
      setReports(data);
    } catch {
      setError('Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return { reports, loading, error, fetchReports };
}

// AdminDashboard.tsx — le composant devient lisible, sans logique
export default function AdminDashboard() {
  const { reports, loading, error } = useReports();
  // ... uniquement le JSX
}
```

**Règle** : si un composant dépasse ~150 lignes, c'est souvent parce que la logique devrait être dans un hook.

---

## Narrowing TypeScript — guard sur une valeur nullable

TypeScript signale une erreur quand on accède à une propriété d'une valeur qui pourrait être `null` ou `undefined`. La solution est un guard : une vérification explicite.

```ts
// AVANT — TypeScript se plaint : 'selected' is possibly null
const handleAddNote = async () => {
  await addNote(selected.id, content); // ⚠️
};

// APRÈS — guard avec early return
const handleAddNote = async () => {
  if (!selected) return; // TypeScript sait qu'après cette ligne, selected est Report
  await addNote(selected.id, content); // ✅
};
```

Autres patterns :

```ts
// Optional chaining — accès sécurisé sans guard explicite
const name = user?.firstName ?? 'Inconnu';

// Non-null assertion — à utiliser avec parcimonie (vous garantissez que ce n'est pas undefined)
const report = reports.find(r => r.id === id)!;
```

---

## Typage des props — interface vs type

```ts
// Déclarer les props d'un composant
interface ReportDetailProps {
  report: Report;
  notes: Note[];
  onClose: () => void;
  onStatusChange: (status: ReportStatus) => void;
}

export function ReportDetail({ report, notes, onClose, onStatusChange }: ReportDetailProps) {
  // ...
}

// Props optionnelles avec valeur par défaut
interface ButtonProps {
  variant?: 'primary' | 'outline' | 'ghost'; // ? = optionnel
  disabled?: boolean;
  children: React.ReactNode;                  // obligatoire
  onClick?: () => void;
}
```

**Règle** : toujours typer les props explicitement. `any` dans les props signale que le type n'est pas maîtrisé.

---

## Composant contrôlé vs non contrôlé

Un composant contrôlé est un `<input>` dont la valeur est gérée par React via `useState`. Dans ce projet, tous les formulaires doivent être contrôlés — c'est la seule façon de valider les champs avant soumission.

```ts
// Composant contrôlé — React est la source de vérité ✅
const [email, setEmail] = useState('');

<input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Composant non contrôlé — à éviter dans ce projet ❌
const inputRef = useRef<HTMLInputElement>(null);
<input ref={inputRef} /> // la valeur vit dans le DOM, pas dans React
```

**Pourquoi c'est important** : la validation frontend ne fonctionne que si vous avez accès à la valeur via un état React. Avec un composant non contrôlé, vous ne pouvez pas vérifier la valeur avant la soumission.
