## 1. Nettoyage git

Ces fichiers sont actuellement trackés et visibles dans le repo livré :

- [ ] Retirer `uploads/avatars/` du tracking : `git rm -r --cached backend/uploads/`
- [ ] Ajouter `backend/uploads/` dans `.gitignore`
- [ ] Supprimer et désindexer `frontend/src/styles/ASupprimer colors.ts`
- [ ] Supprimer et désindexer `frontend/src/styles/ASupprimer theme.ts`
- [ ] Supprimer et désindexer `frontend/src/styles/ASupprimer grade.ts`
- [ ] Ajouter `nginx/certs/` dans `.gitignore` (avant de créer les certs HTTPS)

## 2. HTTPS — exigence technique obligatoire (section III.3 du sujet)

"Any connection to the backend, from a browser, from a script, from an external API, must use HTTPS."

Créer la branche `feat/https` depuis `main` (indépendant des autres PR en cours).

- [ ] Créer `nginx/nginx.conf` (reverse proxy SSL + WebSocket + redirection HTTP→HTTPS)
- [ ] Générer le certificat auto-signé : `openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx/certs/key.pem -out nginx/certs/cert.pem -subj "/CN=localhost"`
- [ ] Ajouter service `nginx` dans `docker-compose.yml`
- [ ] Refactoriser les URLs `http://localhost:5000` hardcodées dans le frontend vers `import.meta.env.VITE_API_URL` :
  - `frontend/src/services/api.ts` (baseURL axios)
  - `frontend/src/components/AdminClasses.tsx`
  - `frontend/src/components/student/StudentProfile.tsx` (AVATAR_BASE + API_BASE)
  - `frontend/src/components/ReportDetail.tsx`
  - `frontend/src/components/admin/AdminUsersList.tsx`
  - `frontend/src/components/admin/AdminUserProfile.tsx`
  - `frontend/src/pages/AdminDashboard.tsx`
- [ ] Mettre à jour CORS dans `backend/src/main.ts` : origin `https://localhost`
- [ ] Mettre à jour CORS WebSocket dans `backend/src/quiz-realtime/quiz-realtime.gateway.ts`
- [ ] Mettre à jour `.env.example` : `VITE_API_URL=https://localhost/api`
- [ ] Mettre à jour les URLs dans `README.md` (http → https)


## 3. ELK — module Major 2pts, gaps à combler

La stack tourne mais deux points du module ne sont pas démontrables à l'éval.

- [ ] Créer 3 visualisations dans Kibana :
  - Volume par tag (Horizontal @timestamp, Vertical Count, Breakdown tags.keyword)
  - Codes HTTP (Horizontal @timestamp, Vertical Count, Breakdown statusCode)
  - Niveaux de log (Horizontal @timestamp, Vertical Count, Breakdown level.keyword)
- [ ] Sauvegarder le dashboard "SafeSchool - Logs Overview"
- [ ] Exporter le dashboard : `curl "http://localhost:5601/api/saved_objects/_export" -H "kbn-xsrf: true" -H "Content-Type: application/json" -d '{"type": ["dashboard", "visualization", "lens"], "includeReferencesDeep": true}' -o elk/setup/kibana-dashboard.ndjson`
- [ ] Ajouter l'import du dashboard dans `elk/setup/setup.sh`
- [ ] Activer `xpack.security.enabled=true` dans elasticsearch (`docker-compose.yml`)
- [ ] Ajouter `ELASTIC_PASSWORD`, `KIBANA_PASSWORD`, `LOGSTASH_PASSWORD` dans `.env` et `.env.example`
- [ ] Configurer l'authentification Kibana et Logstash dans `docker-compose.yml`
- [ ] Mettre à jour `elk/logstash/pipeline/logstash.conf` avec user/password
- [ ] Ajouter la création des users système dans `elk/setup/setup.sh`
- [ ] Retirer l'exposition publique du port ES : `9201:9200` → `expose: "9200"` dans `docker-compose.yml`
- [ ] Vérifier ILM visible dans Kibana → Stack Management → Index Lifecycle Policies après `make up-elk`


## 4. Backend — mode production

- [ ] Ajouter dans `backend/package.json` :
  ```json
  "build": "nest build",
  "start": "nest start",
  "start:prod": "node dist/main"
  ```
- [ ] Modifier `backend/Dockerfile` : ajouter `RUN npm run build`, changer CMD en `npm run start:prod`
- [ ] Tester que `nest build` passe sans erreur TypeScript (`make down && make up`)

Si le TS backend a des erreurs, le build échoue. Tester avant de merger sur main.


## 5. `.env.example` — variables manquantes

- [ ] Ajouter `FRONTEND_URL` (utilisé dans `main.ts` CORS et `quiz-realtime.gateway.ts`)
- [ ] Ajouter `VITE_API_URL` (utilisé dans `useQuizSocket.ts`)
- [ ] Ajouter `ELASTIC_PASSWORD`, `KIBANA_PASSWORD`, `LOGSTASH_PASSWORD` (quand xpack activé)


## 6. Code mort et fichiers à supprimer

- [ ] Supprimer `frontend/src/pages/StatsDashboard.tsx` (hors routing App.tsx — code mort confirmé)
- [ ] Décider si `backup.sh` à la racine doit être documenté dans le README ou supprimé
- [ ] Renommer `docs/to_be_sorted/` en quelque chose de propre avant livraison


## 7. Documentation — README obligatoire

Le README actuel fait 60 lignes. Le draft `docs/Revamped/README.md` existe (303 lignes) avec ~60% de placeholders.

- [ ] Description → Key Features (lister les vraies features)
- [ ] Instructions → Prerequisites avec versions réelles
- [ ] AI Usage → expliquer comment l'IA a été utilisée et pour quelles tâches
- [ ] Project Management → organisation, outils, communication
- [ ] Technical Stack → table backend complète, justifications des choix
- [ ] Database Schema → schéma visuel ou liste des tables avec relations
- [ ] Features List → liste complète avec assignation par membre
- [ ] Modules → liste des modules déclarés + calcul des points (objectif : 14pts minimum)
- [ ] Individual Contributions → détail par personne
- [ ] Remplacer `README.md` racine par le Revamped finalisé


## 8. Tests avant livraison

- [ ] `make prune && make all` sur machine propre (valide le démarrage from scratch)
- [ ] Zéro warning dans la console navigateur sur chaque page (F12 sur chaque vue)
- [ ] Test multi-utilisateur simultané (2 navigateurs différents, connexions croisées)
- [ ] Vérifier bcrypt dans la BDD : `docker compose exec database psql -U $DB_USER -d $DB_NAME -c "SELECT email, password FROM users LIMIT 3;"` → doit commencer par `$2b$`
- [ ] Audit de chaque module déclaré vs scope exact du sujet (vérifier point par point)
- [ ] Vérifier que tous les membres ont des commits significatifs : `git shortlog -sn`


## 9. PWA — 1pt, décidé le 31/05, non commencé

- [ ] Décider en équipe si on le fait ou si on atteint 14pts sans lui
- [ ] Si oui : installer `vite-plugin-pwa`, créer `manifest.json`, configurer service worker
