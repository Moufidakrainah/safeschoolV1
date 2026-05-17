# Audit SafeSchool — Bugs & Tickets consolidés

> Dernière mise à jour : 17 mai 2026
> Source : review code + session de travail PM
> Ce fichier est la référence unique. Tout ce qui est listé ici a été vérifié dans le code.

---

## ⛔ BLOQUANTS — Critères de rejet du projet

### [INFRA] Pas de HTTPS — exigence obligatoire du sujet

> **Sujet** : *"Any connection to the backend, from a browser, from a script, from an external API, must use HTTPS."*
> Si non corrigé avant la soutenance : **rejet automatique du projet, indépendamment des modules.**

**C'est quoi le problème ?**
Toute l'application tourne en HTTP pur. Les tokens JWT, les mots de passe et les données d'élèves circulent en clair sur le réseau. Les connexions WebSocket du quiz sont également non chiffrées (`ws://` au lieu de `wss://`).

**Travail attendu**
- Ajouter un service nginx dans docker-compose.yml (reverse proxy unique, port 443 exposé)
- Redirection automatique HTTP (80) → HTTPS (443)
- Certificat TLS autosigné pour le dev (Let's Encrypt ou équivalent en prod)
- Configuration WebSocket : transmettre les headers `Upgrade` et `Connection`
- Supprimer l'exposition directe des ports 5173 et 5000
- Mettre à jour le CORS backend pour pointer sur l'origin HTTPS

**Critères d'acceptation**
- `http://localhost` redirige vers `https://localhost`
- La connexion WebSocket passe en `wss://`
- Aucun avertissement "mixed content" dans la console navigateur

**Assigné à** : backend / devops

---

### [MODULE] Swagger/OpenAPI manquant — 2 pts Major perdus d'emblée

> Le sujet liste "Implement a public API with Swagger/OpenAPI documentation" comme **Major (2 pts)**.
> Sans Swagger, ce module ne peut pas être revendiqué — et aucune récupération en cours de soutenance n'est possible.

**État vérifié** : aucun `@ApiProperty`, aucun `SwaggerModule.setup()` dans `backend/src/main.ts`, aucun `@nestjs/swagger` dans les imports. L'API n'est pas documentée.

**Travail attendu**
- `npm install @nestjs/swagger swagger-ui-express`
- Ajouter dans `main.ts` :
  ```ts
  const config = new DocumentBuilder()
    .setTitle('SafeSchool API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  ```
- Ajouter `@ApiProperty()` sur les DTOs et `@ApiTags()` sur les controllers

**Critère d'acceptation** : `https://localhost/api/docs` affiche la documentation complète de l'API avec tous les endpoints.

**Note** : si ce module n'est pas visé (décision d'équipe), l'omettre du README et du board. Mais s'il est dans le board, il sera vérifié.

**Assigné à** : backend

---

## 🔴 CRITIQUE — Sécurité

### [SÉCURITÉ] Pas de limite de tentatives sur `/auth/login` (brute force)

**C'est quoi le problème ?**
Il n'y a aucune restriction sur le nombre de tentatives de connexion. Un attaquant peut automatiser des milliers d'essais de mots de passe par seconde sans être bloqué. NestJS a un module officiel pour ça (`@nestjs/throttler`) qui n'est pas installé.

**Travail attendu**
- Installer `@nestjs/throttler`
- Configurer un rate limit sur les routes d'auth (ex. 5 tentatives / minute / IP)

**Critère d'acceptation** : après X tentatives rapides, l'API répond `429 Too Many Requests`.

---

### [SÉCURITÉ] WebSocket quiz ouvert à toutes les origines

**Fichier** : `backend/src/quiz-realtime/quiz-realtime.gateway.ts` ligne 33

**C'est quoi le problème ?**
`@WebSocketGateway({ cors: { origin: '*' } })` — n'importe quel site ou script peut se connecter au quiz WebSocket sans passer par l'application. N'importe qui connaissant l'URL peut rejoindre une session en cours.

**Travail attendu**
- Remplacer `origin: '*'` par l'URL réelle (`https://localhost`)
- Idéalement : valider le token JWT dès la connexion WebSocket

**Critère d'acceptation** : une tentative de connexion depuis une autre origin est rejetée.

---

### [SÉCURITÉ] Aucun en-tête de sécurité HTTP (`helmet` manquant)

**Fichier** : `backend/src/main.ts`

**C'est quoi le problème ?**
Le backend ne renvoie aucun en-tête de sécurité HTTP. Ces en-têtes protègent contre des attaques courantes :
- `X-Frame-Options` : empêche le site d'être embarqué dans une iframe (clickjacking)
- `Content-Security-Policy` : limite quelles ressources le navigateur peut charger
- `X-Content-Type-Options` : empêche le navigateur de deviner le type d'un fichier
- `Strict-Transport-Security` (HSTS) : force le HTTPS

Le package `helmet` pour NestJS ajoute tout ça en une seule ligne. C'est la première chose qu'on installe dans tout projet NestJS sérieux.

**Travail attendu** : `npm install helmet`, puis `app.use(helmet())` dans `main.ts`.

---

### [SÉCURITÉ] pgAdmin accessible avec des credentials en dur

**Fichier** : `docker-compose.yml`

**C'est quoi le problème ?**
pgAdmin (l'interface d'administration de la base de données) est exposé sur le port 8080 avec `admin@safeschool.com` / `admin123` écrits directement dans le docker-compose. N'importe qui sur le réseau peut ouvrir `:8080` et accéder en lecture/écriture à toute la base.

**Travail attendu**
- Déplacer les credentials pgAdmin dans `.env`
- Ne pas exposer le port 8080 à l'extérieur en prod (réseau Docker interne uniquement)

---

### [SÉCURITÉ] Fallback mot de passe BDD en dur dans le code

**Fichier** : `backend/src/app.module.ts` ligne 24

**C'est quoi le problème ?**
`password: process.env.DB_PASSWORD || 'changeme'` — si la variable d'environnement n'est pas définie, l'application démarre quand même avec le mot de passe `changeme`. Ce fallback donne une fausse sécurité et ne doit pas être dans le code source.

**Travail attendu** : supprimer le fallback, faire crasher l'app proprement si la variable est manquante.

---

### [SÉCURITÉ] Pas de refresh token — JWT non révocable

**C'est quoi le problème ?**
Les tokens JWT ont une durée de vie fixe. Une fois émis, ils sont valides jusqu'à expiration même si l'utilisateur s'est déconnecté, même si son compte est désactivé, même si le token a été volé. Impossible de "révoquer" un token.

**Travail attendu**
- Implémenter un système de refresh token (access token court ~15min + refresh token long ~7j)
- Stocker les refresh tokens en base pour pouvoir les invalider
- Ajouter `POST /auth/refresh` et `POST /auth/logout`

**Note** : moins urgent que les autres mais devient critique dès qu'on a des rôles admin sensibles.

---

## 🟠 IMPORTANT — Qualité et conformité sujet

### [QUALITÉ] Validation des données entrantes côté backend manquante

**Fichier** : `backend/src/main.ts` + tous les DTOs

**C'est quoi le problème ?**
Le sujet exige : *"All forms and user inputs must be properly validated in both the frontend and backend."*
`ValidationPipe` (le mécanisme de validation global de NestJS) n'est pas activé dans `main.ts`. Sans ça, les données envoyées à l'API ne sont pas vérifiées côté serveur : types incorrects, champs manquants, valeurs hors limites — tout passe. Les classes `LoginDto` et `RegisterDto` dans `auth.controller.ts` sont de simples objets TypeScript sans aucun décorateur de validation.

**Travail attendu**
- Ajouter `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))` dans `main.ts`
- Ajouter les décorateurs `class-validator` sur tous les DTOs (`@IsString()`, `@IsEmail()`, `@MinLength()`, etc.)

**Critère d'acceptation** : une requête avec un champ invalide est rejetée avec `400 Bad Request` et un message explicite.

---

### [BACKEND] Remplacer `synchronize: true` par des migrations TypeORM

**Fichier** : `backend/src/app.module.ts` ligne 27

**C'est quoi le problème ?**
`synchronize: true` fait que TypeORM compare le code et la base de données à chaque démarrage et tente de les synchroniser automatiquement. C'est pratique en dev rapide mais dangereux : TypeORM peut supprimer des colonnes, recréer des tables, et **ne modifie jamais les types ENUM PostgreSQL existants** — ce qui nous a déjà causé un bug réel (erreurs `invalid input value for enum reports_status_enum` corrigées manuellement dans seed.sql). Sur une vraie base avec des données, une synchro mal gérée peut corrompre silencieusement le schéma.

**Travail attendu**
- Passer `synchronize: false`
- Générer les migrations avec `typeorm migration:generate`
- Les exécuter via `typeorm migration:run` au démarrage

**Critère d'acceptation** : le backend démarre proprement sans synchro auto, les migrations s'exécutent dans l'ordre.

---

### [I18N] Traductions incomplètes — EN et DE

**Résultat de l'audit (vérifié le 17/05/2026)**
- FR : 358 clés (référence)
- EN : 272 clés — **86 clés manquantes**
- DE : 255 clés — **104 clés manquantes**

Exemples de clés manquantes en EN : `admin.stats.low`, `admin.stats.medium`, `student.home.cta`, `student.home.stat1/2/3`…
Exemples supplémentaires manquants en DE : `reporter.quiz.soon`, `reporter.quiz.title`, `reporter.workshop.soon/title`…

**Travail attendu** : aligner EN et DE sur toutes les clés FR. Utiliser la référence FR pour compléter.

---

## 🟡 MODULES — Points à confirmer avant de les revendiquer

### [MODULE] ELK — Rétention et sécurité manquantes

Le module Devops ELK (2 pts) exige selon le sujet : "Implement log retention and archiving policies" et "Secure access to all components."

**⚠️ Rétention** : aucune Index Lifecycle Policy configurée. Les index `safeschool-logs-*` grossissent sans limite.
- Travail : configurer dans Kibana → Stack Management → ILM : hot 7j, delete après 30j.

**⚠️ Sécurité** : `xpack.security.enabled=false` dans docker-compose. Elasticsearch et Kibana sont accessibles sans authentification.
- Travail : activer `xpack.security.enabled=true`, créer les utilisateurs système logstash/kibana, configurer les credentials.

**⚠️ Preuve d'intégration** : aucun livrable ne montre que les logs applicatifs arrivent réellement dans Kibana. Un screenshot de dashboard avec des vrais logs + documentation de vérification est nécessaire pour la soutenance.

---

### [MODULE] User Management Standard (2 pts) — à vérifier

Le module exige 4 choses :
1. Mise à jour du profil utilisateur — probablement OK (route PATCH /users/:id visible)
2. Upload d'avatar — ❌ `avatarUrl` est utilisé dans le frontend mais **n'existe pas dans le schéma BDD** (init.sql) ni dans les endpoints backend. L'avatar affiché est probablement une image statique par défaut.
3. Système d'amis + statut en ligne — ❌ aucune trace dans le code backend ni frontend
4. Page profil par utilisateur — ✅ StudentProfile et ReporterProfile existent

**Sans l'avatar upload et les amis/statut en ligne, ce module ne peut pas être revendiqué.**

---

### [MODULE] Advanced Permissions (2 pts) — à vérifier

Des vérifications de rôle existent dans les controllers (`admin`, `director`, `teacher`, `student`, `staff`). Mais le module exige : CRUD complet sur les utilisateurs + gestion dynamique des rôles + vues différentes par rôle.

À confirmer avec la personne qui a fait l'AdminDashboard :
- Est-ce qu'un admin peut créer/lire/modifier/supprimer des utilisateurs via l'interface ?
- Est-ce que les rôles sont assignables depuis l'interface ?
- Est-ce que chaque rôle a une vue différente (pas juste des guards backend) ?

---

### [MODULE] Gaming — Le quiz compte-t-il comme "web-based game" ? (2 pts)

Le module exige : "players can play live matches", "clear rules and win/loss conditions."

Le quiz WebSocket existe et a une logique de rooms, scores et game-over. Mais :
- Est-ce que deux joueurs peuvent jouer l'un contre l'autre en temps réel ?
- Y a-t-il une condition de victoire/défaite claire affichée à l'utilisateur ?
- Est-ce que le flow complet — rejoindre une room → répondre → voir le classement final — fonctionne de bout en bout ?

**À tester en condition réelle avec deux navigateurs avant la soutenance.**

**⚠️ SOCKET_URL fallback HTTP** : `frontend/src/pages/Quiz.tsx` ligne 51–53 :
```ts
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
```
Si `VITE_SOCKET_URL` n'est pas défini dans `.env`, le quiz se connecte en `ws://` (HTTP) même si l'app tourne en HTTPS → "mixed content" bloqué par le navigateur → quiz inutilisable. S'assurer que `VITE_SOCKET_URL=wss://localhost` est bien dans le `.env` de prod.

---

### [MODULE] Notifications — backend complet, frontend manquant (1 pt)

**Issue board** : #48 "[Web] Notification system" — assignée à Emji6326, Moufidakrainah, hydnumrepandum68

**C'est quoi le module ?**
Le sujet décrit ce module ainsi : *"A complete notification system for all creation, update, and deletion actions."* En clair : quand un signalement est créé, modifié ou supprimé, les utilisateurs concernés reçoivent une notification visible dans l'interface.

**État réel du code :**

Backend — **complet** ✅
- `notification.entity.ts` : entité en base avec `userId`, `reportId`, `message`, `isRead`, `createdAt`
- `notifications.service.ts` : create, getForUser, countUnread, markAsRead
- `notifications.controller.ts` : routes GET /notifications, GET /notifications/unread-count, PATCH /:id/read — protégées par JWT
- `api.ts` (frontend) : les 3 appels API sont définis (`getNotifications`, `getUnreadCount`, `markNotificationRead`)

Frontend — **absent** ❌
- `getNotifications()` n'est appelé dans **aucun composant React**
- Il n'existe pas de composant "cloche" de notification, pas de badge de compteur non lu, pas de liste de notifications dans l'interface
- En l'état, les notifications sont créées et stockées en base mais l'utilisateur ne les voit jamais

**Risque soutenance** : si le module est revendiqué (1pt), un évaluateur demandera à voir les notifications en temps réel dans l'UI. Réponse actuelle : rien ne s'affiche.

**Travail attendu** : créer un composant `NotificationBell` (icône + badge compteur) à placer dans le header de chaque dashboard, avec un dropdown listant les notifications et un bouton "marquer comme lu".

---

## 📋 Croisement Board GitHub × Sujet × Code

> Audit complet effectué le 17/05/2026 — 32 issues MODULE dans le board.

### Modules tracké dans le board — état réel

| # | Titre dans le board | Sujet | Pts | Assigné | Statut board | État réel (code) |
|---|---|---|---|---|---|---|
| 42 | [Web] ORM database (TypeORM) | ✅ exact | 1 | Moufidakrainah | OPEN | ✅ TypeORM utilisé partout |
| 43 | [Web] Advanced search functionality | ✅ exact | 1 | Moufidakrainah | OPEN | ⚠️ à vérifier — Autocomplete existe mais cherche quoi ? |
| 44 | [Web] File upload and management | ✅ exact | 1 | hydnumrepandum68 | OPEN | ❌ aucune trace dans le code (ni endpoint, ni composant upload) |
| 45 | [Web] Real-time features — WebSockets (Quiz) | ✅ exact | 2 | quentinlm | OPEN | ⚠️ gateway WS existe, end-to-end non vérifié |
| 46 | [Web] Progressive Web App (PWA) | ✅ exact | 1 | tous | OPEN | ❌ pas de manifest.json, pas de service worker |
| 47 | [Web] 10 reusable components — Custom design system | ✅ exact | 1 | Emji6326, hydnumrepandum68 | OPEN | ✅ shadcn + composants métier custom > 10 |
| 48 | [Web] Notification system | ✅ exact | 1 | Emji6326, Moufidakrainah, hydnumrepandum68 | OPEN | ⚠️ backend OK, frontend absent |
| 49 | [A11y] WCAG 2.1 AA accessibility compliance | ✅ exact | 2 | Emji6326, hydnumrepandum68 | OPEN | ⚠️ partiel — aria amélioré sur Autocomplete/Pagination, reste non audité |
| 50 | [A11y] Support 3 languages (i18n — fr/en/de) | ✅ exact | 1 | hydnumrepandum68 | OPEN | ⚠️ FR complet, EN −86 clés, DE −104 clés |
| 51 | [A11y] Support 3 browsers | ✅ exact | 1 | — | OPEN (if time) | ❌ testé Chrome uniquement |
| 52 | [User] User management and authentication | ✅ exact | 2 | Moufidakrainah | **DONE** | ⚠️ auth OK mais avatar upload et amis/statut manquants |
| 53 | [User] Advanced permissions system (CRUD) | ✅ exact | 2 | Moufidakrainah | OPEN | ⚠️ guards par rôle OK, CRUD complet via UI non vérifié |
| 54 | [User] Organization system | ✅ exact | 2 | Moufidakrainah | **DONE** | ⚠️ à vérifier — dans notre contexte c'est quoi une "organization" ? (classes ? établissements ?) |
| 55 | [User] Game statistics and match history | ✅ exact | 1 | — | OPEN | ❌ nécessite un jeu fonctionnel, StatsDashboard non intégré |
| 56 | [User] User activity analytics dashboard | ✅ exact | 1 | Emji6326, Moufidakrainah | OPEN | ⚠️ StatsDashboard existe mais non intégré au design system |
| 57 | [AI] LLM interface for report analysis | ✅ exact | 2 | — | OPEN | ✅ **Groq API** (llama-3.3-70b-versatile) dans `scoring.service.ts` — fallback keyword si `AI_ENABLED !== 'true'` |
| 58 | [AI] Sentiment analysis on report descriptions | ✅ exact | 1 | Moufidakrainah | OPEN | ✅ même service — analyse urgence + score émotionnel via LLM, fallback local |
| 59 | [Security] WAF/ModSecurity + HashiCorp Vault | ✅ exact | 2 | — | OPEN | ❌ aucune trace dans le code |
| 60 | [Security] GDPR compliance and consent management | ⚠️ mal catégorisé — c'est "Data & Analytics" dans le sujet | 1 | hydnumrepandum68 | OPEN | ⚠️ Privacy Policy et Terms existent, data deletion non implémentée |
| 61 | [Security] Data export and import | ⚠️ mal catégorisé — c'est "Data & Analytics" dans le sujet | 1 | — | OPEN | ❌ aucune trace dans le code |
| 68 | [Gaming] Web-based game — Quiz SafeSchool | ✅ exact | 2 | quentinlm | OPEN | ⚠️ code existe, end-to-end non vérifié |
| 69 | [Gaming] Remote players support | ✅ exact | 2 | quentinlm | OPEN | ⚠️ WebSocket multi-clients possible mais "latency + reconnection" non vérifié |
| 70 | [Gaming] Multiplayer 3+ | ✅ exact | 2 | quentinlm | OPEN | ⚠️ rooms WebSocket multi-joueurs possibles, à tester |
| 71 | [Gaming] another game with user history and matchmaking | ✅ exact | 2 | quentinlm | OPEN | ❌ aucun "second jeu" visible dans le code |
| 72 | [Gaming] Spectator mode | ✅ exact | 1 | quentinlm | OPEN | ⚠️ à vérifier si un spectateur peut rejoindre une room |
| 73 | [Gaming] gamification system | ✅ exact | 1 | quentinlm | OPEN | ❌ aucune trace (achievements, badges, XP, etc.) |
| 74 | [DevOps] ELK Stack | ✅ exact | 2 | Moufidakrainah | **DONE** | ⚠️ démarré, mais rétention et sécurité manquantes (voir section MODULES) |
| 75 | [DevOps] Prometheus + Grafana monitoring | ✅ exact | 2 | — | OPEN (UNASSIGNED) | ❌ aucune trace dans le code |
| 76 | [DevOps] Backend health check endpoint | ✅ exact | 1 | Moufidakrainah | OPEN | ⚠️ à vérifier |
| 77 | [Data] Advanced analytics dashboard | ✅ exact | 2 | — | OPEN (UNASSIGNED) | ⚠️ StatsDashboard existe mais non complet |

### Modules du sujet absents du board

Ces modules existent dans le sujet mais n'ont **aucune issue** dans le board. Soit c'est intentionnel (module non visé), soit c'est un oubli :

| Module sujet | Pts | Commentaire |
|---|---|---|
| [Web] Frameworks frontend + backend | 2 (Major) | Clairement fait (React + NestJS) — **manque une issue DONE pour le score** |
| [Web] Public API Swagger/OpenAPI | 2 (Major) | **0 code écrit** — si visé, grosse implémentation à planifier ; si non visé, retirer du board |
| [Web] Real-time collaborative features | 1 (Minor) | Non implémenté |
| [Web] SSR | 1 (Minor) | Non implémenté |
| [Web] Advanced search with filters/sorting/pagination | 1 (Minor) | #43 dans le board — doublon ou intention différente ? |
| [A11y] RTL language support | 1 (Minor) | Non implémenté |
| [User] OAuth 2.0 | 1 (Minor) | Non implémenté |
| [User] 2FA | 1 (Minor) | Non implémenté |
| [Gaming] Tournament system | 1 (Minor) | Non implémenté, pas d'issue |
| [Gaming] Game customization options | 1 (Minor) | Non implémenté, pas d'issue |
| [Gaming] Advanced 3D graphics | 2 (Major) | Non implémenté |
| [AI] RAG system | 2 (Major) | Non implémenté |
| [AI] Recommendation system | 2 (Major) | Non implémenté |
| [AI] Content moderation | 1 (Minor) | Non implémenté |
| [AI] Voice/speech integration | 1 (Minor) | Non implémenté |
| [Data] Data export/import | 1 (Minor) | #61 dans le board (mal catégorisé en Security) |
| [Blockchain] | 2/1 | Non visé — OK |

### Problèmes dans le board

1. **#60 et #61 sont catégorisés "[Security]"** alors qu'ils appartiennent à "Data & Analytics" dans le sujet. Pas un blocant mais ça crée de la confusion.

2. **#52 [User] User management marqué DONE** alors que avatar upload et friends/statut en ligne manquent — deux des quatre critères du module. À re-ouvrir ou à décrire précisément ce qui est fait vs ce qui ne l'est pas.

3. **#54 [User] Organization system marqué DONE** — le module du sujet demande de créer/éditer/supprimer des organisations et d'y ajouter/retirer des utilisateurs. Dans le contexte SafeSchool, ça correspond à quoi exactement ? Les classes ? L'établissement ? À documenter dans l'issue pour l'évaluation.

4. **[Web] Frameworks (React + NestJS)** = 2pts obvieux mais **aucune issue ne les track**. Sans issue DONE dans le board, c'est invisible dans le décompte des points. Créer une issue `[Web] Use frontend + backend framework — React + NestJS` et la fermer comme DONE.

5. **#71 "another game with user history and matchmaking"** est assigné à quentinlm mais aucun "second jeu" n'existe dans le code. Si ce module est revendiqué, c'est une bombe à la soutenance.

### Score estimé (état actuel du code, hors testing)

| Catégorie | Points estimés | Commentaire |
|---|---|---|
| Web: Frameworks | 2 | ✅ React + NestJS — non tracké dans le board |
| Web: ORM | 1 | ✅ TypeORM |
| Web: Real-time WebSockets | 2 | ⚠️ end-to-end non vérifié |
| Web: Notification system | 0 | ❌ frontend manquant |
| Web: Custom design system | 1 | ✅ shadcn + composants métier |
| A11y: i18n 3 langues | 0 | ⚠️ 86–104 clés manquantes, risqué |
| User: Standard user management | 0 | ⚠️ avatar et amis manquants |
| User: Advanced permissions | 2 | ⚠️ probable si CRUD UI complet |
| User: Organization system | 2 | ⚠️ à confirmer avec Moufidakrainah |
| DevOps: ELK | 2 | ⚠️ rétention + sécurité à finir |
| Gaming: Web-based game | 2 | ⚠️ end-to-end non vérifié |
| AI: LLM interface (Groq) | 2 | ✅ `scoring.service.ts` — Groq API + fallback keyword |
| AI: Sentiment analysis | 1 | ✅ même service — urgence + score émotionnel |
| **Total conservateur** | **9–11** | Sans les modules risqués |
| **Total optimiste** | **16–18** | Si tout ce qui est "⚠️" est propre |

**⚠️ Rappel : sans HTTPS, le projet est rejeté avant même de compter les points.**

---

## ⚪ À INVESTIGUER — État inconnu

### [RISK] Tests — zéro fichier `.spec.ts` dans le backend

Aucun test automatisé n'existe dans `backend/src/`. Les commentaires dans `users.controller.ts` mentionnent des cas de test (curl) mais ce sont des exemples manuels, pas des tests automatisés.

Pour la soutenance, avoir au minimum des tests manuels documentés sur :
- Login valide → token retourné
- Login invalide → 401
- Route protégée sans token → 401
- Route protégée avec mauvais rôle → 403

---

### [RISK] Avatar upload — fonctionnalité absente

Voir section User Management Standard ci-dessus. L'`avatarUrl` est référencé dans le frontend mais il n'y a pas de colonne dans la BDD, pas d'endpoint upload, pas de stockage. Si ce module est revendiqué, c'est un point de défaillance immédiate en soutenance.

---

### [DOC] README — 9 sections imposées par le sujet (critère éliminatoire)

> Le sujet impose un README en anglais avec exactement ces 9 sections. Un README incomplet peut entraîner un rejet avant même l'évaluation des modules.

| # | Section | Contenu requis |
|---|---|---|
| 1 | Première ligne italique | Logins de tous les membres de l'équipe |
| 2 | Description + features | Ce que fait l'app, les fonctionnalités principales |
| 3 | Instructions | Prérequis, copie du `.env`, commandes pour démarrer |
| 4 | Resources + IA utilisée | Sources utilisées, outils IA (Copilot, ChatGPT, etc.) |
| 5 | Team Information | Noms + rôles de chaque membre |
| 6 | Project Management | Comment le projet a été géré (GitHub Projects, réunions, etc.) |
| 7 | Technical Stack | Toutes les technos avec justification du choix |
| 8 | Database Schema | Schéma de la base de données (diagramme ou description) |
| 9 | Features List + Modules | Liste des features, modules revendiqués avec calcul de points, contributions individuelles |

À tester : demander à quelqu'un qui n'a pas participé de lancer le projet uniquement avec le README — si ça bloque, documenter où.

**Assigné à** : hydnumrepandum68 (PM)

---

### [DOC] `.env.example` — complet et à jour ?

Toutes les variables utilisées dans le code doivent être dans `.env.example` avec leur format attendu. À vérifier que rien n'a été ajouté depuis la dernière mise à jour du fichier.

---

### [QA] Parcours manuel à tester pour chaque rôle

Avant la soutenance, faire tourner ces flows :

| Rôle | Flow à tester |
|---|---|
| Élève (student) | Login → remplir formulaire de signalement → soumettre → voir confirmation |
| Enseignant (reporter) | Login → voir les signalements → accéder au quiz → jouer |
| Admin | Login → voir le dashboard → créer/modifier un utilisateur → voir les stats |
| Direction (director) | Login → accès aux stats → accès aux signalements |

---

### [I18N] Support 3 navigateurs — état et pièges

Voir section dédiée en bas de ce fichier.

---

## ✅ TERMINÉ — Audité et corrigé

| Ticket | Fichier | Détail |
|---|---|---|
| Enum PostgreSQL `reports_status_enum` | `database/seed.sql` | DO $$ block avec IF NOT EXISTS pour les 5 valeurs |
| Audit mobile responsive | Multiples fichiers | grid-cols-2 → responsive, overflow-x-auto sur tables, Login flex-col |
| Shadcn migration | ReportDetail, StudentForm, ReporterForm, Login, Quiz… | textarea/input → composants shadcn |
| NoteBlock couleur hardcodée | `components/NoteBlock.tsx` | text-purple-700 → text-warning |
| ReporterProfile JSX cassé | `components/reporter/ReporterProfile.tsx` | `</div> &&` corrigé en `</div>\n{staffProfile.classes &&` |
| Makefile nettoyé | `Makefile` | Suppression des cibles redondantes, ajout de sections |
| Guide ELK | `docs/technical/elk-guide.md` | Protocole d'utilisation complet |
| Explication architecture HTTPS/nginx | `docs/technical/architecture.md` | Section dédiée ajoutée |
| Explication shadcn + Tailwind responsive | `docs/dev/shadcn-migration.md` | Sections pédagogiques ajoutées |

---

## Annexe — Support navigateurs

### État actuel

Développement et test effectués sur Chrome uniquement.

### Chromium ≠ Chrome pour les modules

**Chromium et Chrome comptent comme deux navigateurs distincts** pour le module "support 3 navigateurs supplémentaires". Ils partagent le même moteur de rendu (Blink) et les mêmes APIs — en pratique, si ça marche sur l'un, ça marche sur l'autre. Un évaluateur averti peut contester Chromium + Chrome comme "2 navigateurs" au sens du module. Le plus sûr est de cibler Firefox + Safari (ou Edge) en plus de Chrome.

### Pièges classiques Firefox à corriger

| Problème | Présent dans notre code ? | Description |
|---|---|---|
| `input[type=datetime-local]` | **✅ OUI** — ReportDetail.tsx:213 + AdminDashboard.tsx:546 | Firefox ne rend pas le date-time picker natif de la même façon que Chrome. Sous Firefox, `datetime-local` affiche deux champs séparés (date + heure) sans calendrier cliquable. L'affichage peut paraître cassé visuellement. |
| Scrollbar width | Probable — à vérifier | Firefox affiche des scrollbars plus larges sur Linux, ce qui peut décaler des layouts calculés en CSS |
| `gap` dans flexbox | Très peu probable | Anciens Firefox (< 63) ne supportent pas `gap` en flex — négligeable en 2026 |
| CSS `:focus-visible` | Possible | Comportement légèrement différent de Chrome |
| WebSocket | Non concerné | Socket.io gère le fallback automatiquement |
| Fonts | Possible | Certaines polices Google Fonts peuvent rendre différemment |
| `backdrop-filter` | **❌ Non présent** dans le code | `grep -r "backdrop-filter"` → aucun résultat. Pas de problème à prévoir sur ce point. |

**Action prioritaire pour Firefox** : remplacer les deux `input[type=datetime-local]` par un composant React compatible cross-browser (par exemple `react-day-picker` ou un simple `input[type=text]` avec format masqué). Ou accepter le comportement différent et le documenter pour le module "3 navigateurs".

### Méthode de test rapide

1. Ouvrir Firefox et naviguer sur toutes les pages de chaque rôle
2. Ouvrir la console (F12) et noter tous les warnings/errors
3. Vérifier particulièrement : formulaires, tableaux, quiz WebSocket, login
4. Faire de même sur Edge (ou Safari si dispo)
