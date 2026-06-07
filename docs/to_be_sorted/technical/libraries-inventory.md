# Inventaire des dépendances — SafeSchool

> Source de vérité : `frontend/package.json`, `backend/package.json`, `docker-compose.yml`
> Dernière mise à jour : mai 2026
>
> **Deux niveaux :**
> - Ce document = inventaire **exhaustif** pour usage interne / compréhension du projet
> - Pour le README officiel : garder seulement les technos significatives (voir section README ci-dessous)

---

## Frontend (`frontend/package.json`)

### Dépendances de production

| Paquet | Version | Rôle |
|--------|---------|------|
| `react` | ^19.2.4 | Librairie UI — construction de l'interface par composants, gestion de l'état via les hooks |
| `react-dom` | ^19.2.4 | Rendu de React dans le DOM du navigateur |
| `react-router-dom` | ^7.14.0 | Routage côté client — navigation entre pages sans rechargement, routes protégées |
| `axios` | ^1.14.0 | Client HTTP — tous les appels API REST vers le backend, intercepteur JWT |
| `socket.io-client` | ^4.8.3 | Client WebSocket — connexion au gateway NestJS pour le module Quiz temps réel |
| `i18next` | ^26.0.8 | Moteur d'internationalisation — gestion des traductions (fr, en, de) |
| `react-i18next` | ^17.0.6 | Binding React pour i18next — hook `useTranslation()` dans les composants |
| `i18next-browser-languagedetector` | ^8.2.1 | Détection automatique de la langue du navigateur |
| `tailwindcss` | ^4.2.4 | Framework CSS utilitaire — classes atomiques appliquées dans les composants |
| `@tailwindcss/vite` | ^4.2.4 | Plugin Vite pour Tailwind (remplace postcss dans ce projet) |
| `shadcn` | ^4.7.0 | CLI pour ajouter des composants shadcn/ui dans le projet |
| `@base-ui/react` | ^1.4.1 | Composants accessibles non stylés (Radix UI) — utilisés par shadcn |
| `lucide-react` | ^1.16.0 | Bibliothèque d'icônes SVG sous forme de composants React |
| `recharts` | ^3.8.1 | Graphiques React déclaratifs (`<BarChart>`, `<LineChart>`, etc.) pour le dashboard stats |
| `class-variance-authority` | ^0.7.1 | Utilitaire pour déclarer des variantes de composants avec Tailwind |
| `clsx` | ^2.1.1 | Utilitaire pour combiner des noms de classes CSS conditionnellement |
| `tailwind-merge` | ^3.6.0 | Fusion intelligente de classes Tailwind (évite les conflits) |
| `tw-animate-css` | ^1.4.0 | Animations CSS pré-construites compatibles Tailwind |
| `@fontsource-variable/geist` | ^5.2.8 | Police Geist (variable font) — chargée localement sans Google Fonts |

### Dépendances de développement (devDependencies)

| Paquet | Version | Rôle |
|--------|---------|------|
| `vite` | ^8.0.1 | Bundler et serveur de dev — compile TypeScript + JSX, hot reload (HMR) |
| `@vitejs/plugin-react` | ^6.0.1 | Plugin Vite pour activer la transformation JSX React |
| `typescript` | ~5.9.3 | Compilateur TypeScript |
| `eslint` | ^9.39.4 | Linter — analyse statique du code |
| `typescript-eslint` | ^8.57.0 | Règles ESLint spécifiques à TypeScript |
| `eslint-plugin-react-hooks` | ^7.0.1 | Règles ESLint pour les hooks React |
| `eslint-plugin-react-refresh` | ^0.5.2 | Règles ESLint pour la compatibilité Vite HMR |
| `@eslint/js` | ^9.39.4 | Règles ESLint JavaScript de base |
| `globals` | ^17.4.0 | Définitions des variables globales (browser, node) pour ESLint |
| `autoprefixer` | ^10.5.0 | Plugin PostCSS — ajoute les préfixes vendor CSS automatiquement |
| `postcss` | ^8.5.10 | Processeur CSS (utilisé par autoprefixer) |
| `@types/react` | ^19.2.14 | Types TypeScript pour React |
| `@types/react-dom` | ^19.2.3 | Types TypeScript pour react-dom |
| `@types/node` | ^24.12.0 | Types TypeScript pour Node.js (accès à `process`, `path`, etc.) |

---

## Backend (`backend/package.json`)

### Dépendances de production

| Paquet | Version | Rôle |
|--------|---------|------|
| `@nestjs/common` | ^11.0.1 | Noyau NestJS — décorateurs, guards, pipes, interceptors |
| `@nestjs/core` | ^11.0.1 | Moteur NestJS |
| `@nestjs/config` | ^4.0.3 | Gestion des variables d'environnement (`.env`) |
| `@nestjs/jwt` | ^11.0.2 | Signature et vérification des tokens JWT |
| `@nestjs/passport` | ^11.0.5 | Intégration Passport dans NestJS |
| `@nestjs/platform-express` | ^11.0.1 | Adaptateur Express pour NestJS (serveur HTTP) |
| `@nestjs/typeorm` | ^11.0.1 | Intégration TypeORM dans NestJS |
| `@nestjs/websockets` | ^11.1.19 | Support WebSocket dans NestJS |
| `@nestjs/platform-socket.io` | ^11.1.19 | Adaptateur Socket.io pour NestJS |
| `typeorm` | ^0.3.28 | ORM — mapping entités TypeScript ↔ tables PostgreSQL |
| `pg` | ^8.20.0 | Driver PostgreSQL pour Node.js (utilisé par TypeORM) |
| `passport` | ^0.7.0 | Middleware d'authentification |
| `passport-jwt` | ^4.0.1 | Stratégie JWT pour Passport — extraction et validation du token |
| `bcrypt` | ^6.0.0 | Hash des mots de passe (irréversible) |
| `class-validator` | ^0.15.1 | Décorateurs de validation des DTOs (`@IsEmail()`, `@IsNotEmpty()`, etc.) |
| `class-transformer` | ^0.5.1 | Transformation des objets plain JS en instances de classes TypeScript |
| `socket.io` | ^4.8.3 | Serveur WebSocket — gateway temps réel pour le Quiz |
| `winston` | ^3.11.0 | Logger structuré — envoi des logs vers Logstash |
| `winston-transport` | ^4.7.0 | Transport personnalisé pour Winston |
| `rxjs` | ^7.8.1 | Programmation réactive — utilisé en interne par NestJS |
| `reflect-metadata` | ^0.2.2 | Polyfill pour les décorateurs TypeScript — requis par NestJS et TypeORM |

### Dépendances de développement (devDependencies)

| Paquet | Version | Rôle |
|--------|---------|------|
| `@nestjs/cli` | ^11.0.0 | CLI NestJS — génération de modules, controllers, services |
| `ts-node` | ^10.9.2 | Exécution TypeScript sans compilation préalable (dev) |
| `typescript` | ^5.7.3 | Compilateur TypeScript |
| `eslint` | ^9.18.0 | Linter |
| `typescript-eslint` | ^8.20.0 | Règles ESLint TypeScript |
| `eslint-config-prettier` | ^10.0.1 | Désactive les règles ESLint qui conflictent avec Prettier |
| `eslint-plugin-prettier` | ^5.2.2 | Intègre Prettier comme règle ESLint |
| `prettier` | ^3.4.2 | Formateur de code automatique |
| `jest` | ^30.0.0 | Framework de tests unitaires |
| `ts-jest` | ^29.2.5 | Transformer Jest pour TypeScript |
| `@nestjs/testing` | ^11.0.1 | Utilitaires de test NestJS |
| `supertest` | ^7.0.0 | Tests d'intégration HTTP |
| `source-map-support` | ^0.5.21 | Stack traces lisibles en prod (mapping source → JS compilé) |
| `@types/bcrypt` | ^6.0.0 | Types TypeScript pour bcrypt |
| `@types/express` | ^5.0.0 | Types TypeScript pour Express |
| `@types/jest` | ^30.0.0 | Types TypeScript pour Jest |
| `@types/passport-jwt` | ^4.0.1 | Types TypeScript pour passport-jwt |
| `@types/supertest` | ^7.0.0 | Types TypeScript pour supertest |
| `@types/node` | ^24.0.0 | Types TypeScript pour Node.js |
| `tsconfig-paths` | ^4.2.0 | Résolution des alias de chemins TypeScript à l'exécution |
| `ts-loader` | ^9.5.2 | Loader TypeScript pour webpack (utilisé par NestJS CLI) |

---

## Infrastructure (`docker-compose.yml`)

| Service | Image | Version | Port exposé | Rôle |
|---------|-------|---------|-------------|------|
| frontend | image buildée localement | — | 5173 | Serveur Vite dev |
| backend | image buildée localement | — | 5000→3000 | API NestJS |
| database | `postgres` | 15-alpine | 5433→5432 | Base de données PostgreSQL |
| elasticsearch | `docker.elastic.co/elasticsearch/elasticsearch` | 8.12.0 | 9201→9200 | Stockage et recherche des logs |
| logstash | `docker.elastic.co/logstash/logstash` | 8.12.0 | 5044 | Pipeline d'ingestion des logs |
| kibana | `docker.elastic.co/kibana/kibana` | 8.12.0 | 5601 | Interface de visualisation des logs |

---

## Sélection pour le README officiel

Les technos à mentionner dans la section "Technical Stack" du README (les autres sont des détails d'implémentation) :

