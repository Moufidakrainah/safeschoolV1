# Stack technique — SafeSchool

> Document de référence livrable avec le projet. Décrit toutes les technologies utilisées, leur rôle précis et les raisons des choix effectués.  
> Pour le détail de fonctionnement de chaque couche : voir [`docs/manuel-reference-projet.md`](../manuel-reference-projet.md).

---

## Architecture générale

SafeSchool est une application **SPA + API REST** :

```
Navigateur
    │
    ▼
[Frontend — React 18 + Vite 5]   ←  Fichiers statiques servis par Vite
    │  HTTPS REST + WebSocket
    ▼
[Backend — NestJS 10 + Node.js]  ←  API REST, logique métier, WebSocket Gateway
    │  TCP
    ▼
[PostgreSQL 15]                  ←  Base de données relationnelle
    │
    ▼
[ELK Stack]                      ←  Logs centralisés (Elasticsearch + Logstash + Kibana)
```

Tous les services sont orchestrés par **Docker Compose** et communiquent via un réseau interne Docker (`safeschool_network`). Aucun service n'est directement accessible depuis l'extérieur sauf via les ports exposés explicitement.

---

## Frontend

|  |  |  |
|---|---|---|
| **React** | 18 | Construction de l'interface sous forme de composants. Gestion de l'état local et du cycle de vie via les hooks. |
| **TypeScript** | 5 | Typage statique sur l'ensemble du code frontend. Détection des erreurs à la compilation plutôt qu'à l'exécution. |
| **Vite** | 5 | Bundler et serveur de développement. Compile le TypeScript + JSX, applique Tailwind, sert les fichiers statiques avec HMR. |
| **React Router** | 6 | Routage côté client — navigation entre pages sans rechargement, gestion des routes protégées (`ProtectedRoute`). |
| **Axios** | 1.x | Client HTTP. Centralise tous les appels API dans `services/api.ts`. Intercepteur pour injection automatique du token JWT. |
| **Tailwind CSS** | 4 | Framework CSS utilitaire. Styles définis directement dans les composants via des classes. Thème de couleurs sémantiques (`primary`, `critical`, `warning`) configuré via `@theme` dans `index.css`. Plugin `@tailwindcss/vite` (pas postcss). |
| **shadcn/ui** | — | Collection de composants React copiés dans le projet (pas une dépendance npm). Construits sur Radix UI. Code dans `src/components/ui/`. Ajout : `npx shadcn@latest add <composant>`. Voir [`docs/design/design-system.md`](../design/design-system.md). |
| **Radix UI** | — | Primitives accessibles (ARIA, navigation clavier) utilisées par shadcn. Installées automatiquement à l'ajout de chaque composant shadcn. |
| **react-i18next** | 15 | Internationalisation. Fichiers de traduction JSON (`fr`, `en`, `de`) dans `src/i18n/`. Hook `useTranslation()` dans chaque composant. |
| **Recharts** | 2.x | Bibliothèque de graphiques React pour `StatsDashboard.tsx`. Composants déclaratifs (`<BarChart>`, `<LineChart>`, etc.). |
| **Socket.io-client** | 4 | Client WebSocket pour le module Quiz temps réel. Connexion au gateway NestJS depuis `Quiz.tsx`. |

---

## Backend

|  |  |  |
|---|---|---|
| **NestJS** | 10 | Framework Node.js structurant le backend en modules, controllers et services. Gestion des routes HTTP, injection de dépendances, guards d'authentification. |
| **Node.js** | 20 | Environnement d'exécution JavaScript côté serveur. NestJS s'exécute sur Node.js. |
| **TypeScript** | 5 | Même langage que le frontend. Types partagés possibles, détection d'erreurs à la compilation. |
| **TypeORM** | 0.3 | ORM (Object-Relational Mapper). Fait le lien entre les entités TypeScript et les tables PostgreSQL. Utilisé avec `synchronize: true` en développement. |
| **Passport** | 0.7 | Middleware d'authentification. Gère la stratégie JWT (`passport-jwt`) : extraction du token depuis le header `Authorization`, validation de la signature. |
| **JWT** | — | `@nestjs/jwt` — signature et vérification des tokens. Payload : `{ sub: userId, email, role }`. |
| **bcrypt** | — | Hash irréversible des mots de passe. `bcrypt.hash()` à la création, `bcrypt.compare()` à la connexion. |
| **Socket.io** | 4 | WebSocket gateway pour le module Quiz temps réel (`quiz-realtime.gateway.ts`). Gestion des rooms, émission d'événements (`question`, `answer`, `leaderboard`). |
| **class-validator** | — | Décorateurs de validation pour les DTOs (`@IsEmail()`, `@IsNotEmpty()`, etc.). Utilisé avec `ValidationPipe` pour rejeter les données malformées avant qu'elles atteignent la base. |
| **Groq SDK** | — | Interface LLM (Large Language Model). `scoring.service.ts` appelle Groq conditionnellement si `AI_ENABLED=true` pour scorer les signalements (`scoreAIGroq()`). Fallback sans IA via `scoreAIFallback()`. |



## Base de données

|  |  |  |
|---|---|---|
| **PostgreSQL** | v. 15 | Base de données relationnelle principale. Stocke les utilisateurs, signalements, notes, profils, classes, parents, notifications. |

---

## Infrastructure

|  |  |  |
|---|---|---|
| **Docker** | 24+ | Containerisation de chaque service dans un environnement reproductible. Garantit que l'application fonctionne identiquement sur toutes les machines de développement et en production. |
| **Docker Compose** | 2.x | Orchestration des 7 conteneurs (frontend, backend, database, elasticsearch, logstash, kibana) avec leurs dépendances, volumes et réseau commun. |
| **Elasticsearch** | 8 | Moteur de recherche et stockage des logs. Reçoit les logs formatés depuis Logstash. |
| **Logstash** | 8 | Pipeline de traitement des logs. Reçoit les logs HTTP du backend (port 5044), les formate selon le pipeline configuré dans `elk/logstash/pipeline/`, les envoie à Elasticsearch. |
| **Kibana** | 8 | Interface de visualisation des logs Elasticsearch (port 5601). Permet de monitorer l'activité et déboguer sans accès aux conteneurs. |

---

## Outils de développement

|  |  |
|---|---|
| **Git / GitHub** | Versioning et collaboration. Workflow : branches par feature, PRs vers `frontend/main`, merge vers `main`. |
| **ESLint** | Linter TypeScript/React. Configuré dans `eslint.config.mjs` (backend) et `eslint.config.js` (frontend). |
| **Prettier** | Formatage automatique du code. À lancer avec `npx prettier --write "src/**/*.{ts,tsx}"` avant chaque PR. |

---

## Récapitulatif des ports exposés

| Service | Port interne | Port externe (machine hôte) |
|---|---|---|
| Frontend (Vite) | 5173 | 5173 |
| Backend (NestJS) | 3000 | 5000 |
| PostgreSQL | 5432 | 5433 |
| Elasticsearch | 9200 | 9201 |
| Logstash | 5044 | 5044 |
| Kibana | 5601 | 5601 |


