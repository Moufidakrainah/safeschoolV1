# HTTPS Implementation — Ticket

## Contexte

Exigence obligatoire sujet (section III.3) :
> Any connection to the backend, from a browser, from a script, from an external API, must use HTTPS.
> Connections inside the backend itself (e.g., web server and database, software inside your container(s)) can be without encryption.

**État actuel :** toute l'application tourne en HTTP pur.
Les tokens JWT, mots de passe et données d'élèves circulent en clair.
Les WebSockets du quiz sont en `ws://` au lieu de `wss://`.

## Architecture cible

```
Browser → HTTPS:443 → nginx (SSL termination) → HTTP → backend:3000
          HTTP:80  ↗ (redirect automatique)    → HTTP → frontend:5173
```

Nginx est le seul point d'entrée exposé. Le backend reste en HTTP interne — autorisé explicitement par le sujet.

## Objectifs de validation

- `http://localhost` redirige automatiquement vers `https://localhost`
- La connexion WebSocket passe en `wss://`
- Zéro warning "mixed content" dans la console navigateur (F12)
- Les ports `5000` et `5173` ne sont plus directement accessibles depuis l'hôte

---

## Roadmap

### 1. Infrastructure nginx

- [ ] Créer `nginx/nginx.conf` — reverse proxy SSL + redirect HTTP→HTTPS + WebSocket upgrade (`Upgrade`, `Connection` headers)
- [ ] Générer le certificat auto-signé (commande ci-dessous) — **ne pas commiter**
- [ ] Ajouter `nginx/certs/` dans `.gitignore`
- [ ] Ajouter le service `nginx` dans `docker-compose.yml` (ports `80:80` et `443:443`)
- [ ] Retirer l'exposition directe des ports `5173:5173` et `5000:3000` du frontend/backend

### 2. Variables d'environnement

- [ ] Créer `frontend/.env.example` avec `VITE_API_URL=https://localhost/api`
- [ ] Ajouter `VITE_API_URL=https://localhost/api` dans `.env` racine
- [ ] Ajouter `FRONTEND_URL=https://localhost` dans `.env` racine
- [ ] Mettre à jour `.env.example` racine : remplacer `REACT_APP_API_URL` par `VITE_API_URL`

### 3. Frontend — supprimer les URLs hardcodées (9 occurrences, 7 fichiers)

| Fichier | Ligne | À faire |
|---------|-------|---------|
| `frontend/src/services/api.ts` | 4 | `baseURL` → `import.meta.env.VITE_API_URL` |
| `frontend/src/hooks/useQuizSocket.ts` | 82 | fallback → `import.meta.env.VITE_API_URL` (lire le code, logique déjà partielle) |
| `frontend/src/components/admin/AdminClasses.tsx` | 87 | URL avatar |
| `frontend/src/components/admin/AdminUserProfile.tsx` | 114 | URL avatar |
| `frontend/src/components/admin/AdminUsersList.tsx` | 127 | URL avatar |
| `frontend/src/components/admin/ReportDetail.tsx` | 14 | URL avatar |
| `frontend/src/components/student/StudentProfile.tsx` | 28–29 | `AVATAR_BASE` + `API_BASE` |
| `frontend/src/hooks/useUsers.ts` | 144 | URL upload avatar |

### 4. Backend — CORS

- [ ] `backend/src/main.ts` — vérifier que `origin` lit `process.env.FRONTEND_URL` (fallback à changer de `http://localhost:5173` → `https://localhost`)
- [ ] `backend/src/quiz-realtime/quiz-realtime.gateway.ts` — idem

### 4.5 Sécurité HTTP — headers

- [ ] `npm install helmet` dans `backend/`
- [ ] `app.use(helmet())` dans `backend/src/main.ts` (avant `app.listen`)

### 4.6 WebSocket — origin

- [ ] `quiz-realtime.gateway.ts` — remplacer `origin: '*'` par `process.env.FRONTEND_URL`
- [ ] (bonus) Valider le token JWT à la connexion WebSocket via un guard NestJS

---

## Commande de génération du certificat

À exécuter **une seule fois** après `git clone`, avant `make up` :

```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem \
  -subj "/CN=localhost"
```

Les certs ne sont pas commités (`.gitignore`). Chaque dev les génère localement.

---

## Notes pour la livraison README

- **Technical Stack** : mentionner nginx comme reverse proxy avec SSL termination
- **Instructions** : ajouter l'étape de génération du certificat + `VITE_API_URL=https://localhost/api` dans `.env`
