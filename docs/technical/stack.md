# 🛡️ SafeSchool

> Application de gestion des signalements de harcèlement scolaire

---

## 📚 Comprendre la stack technique

### TypeScript
> JavaScript avec des règles strictes — évite les bugs avant même d'exécuter le code.

### Node.js
> JavaScript hors du navigateur — permet de faire tourner JavaScript sur un serveur.

### NestJS
> L'organisateur du backend. Il structure le code en modules propres (auth, users, reports...).

### React
> Le constructeur de pages web. Construit l'interface que l'utilisateur voit dans Firefox.

### Vite
> Le préparateur du code React. Le navigateur ne comprend pas TypeScript directement — Vite transforme tout en HTML/CSS/JavaScript que Firefox peut lire.

### TypeORM
> Le traducteur entre TypeScript et la base de données.

Sans TypeORM, tu dois écrire du SQL manuellement :
```sql
SELECT * FROM users WHERE email = 'test@test.com';
```

Avec TypeORM, tu écris en TypeScript et il traduit tout seul :
```typescript
this.usersRepository.findOne({ where: { email: 'test@test.com' } });
// TypeORM traduit automatiquement en SQL
```

### PostgreSQL
> La base de données. Stocke toutes les informations dans des tables organisées.

### Docker
> Les boîtes isolées. Met chaque service dans un conteneur avec tout ce dont il a besoin — plus de "ça marche sur mon PC mais pas sur le tien".

### JWT
> Le ticket d'authentification. Quand tu te connectes, le serveur te donne un ticket signé. Tu présentes ce ticket à chaque requête pour prouver qui tu es. Le serveur n'a pas besoin de mémoriser qui est connecté — il vérifie juste le ticket.

### bcrypt
> Le broyeur de mots de passe. On ne stocke jamais un mot de passe en clair. bcrypt le transforme en une chaîne illisible :
```
"eleve123"  →  bcrypt  →  "$2b$10$zJVzXEfx..."
```

### Passport.js
> Le videur. Vérifie le JWT à l'entrée de chaque route protégée. Il récupère le token dans le header de la requête, vérifie sa signature, et injecte l'utilisateur dans `req.user`.

### Axios
> Le messager. La bibliothèque que React utilise pour envoyer des requêtes au backend.

### React Router
> Le GPS des pages. Sans React Router, changer de page rechargerait toute l'application. Avec lui, la navigation est instantanée.

---

## 🔄 Comment ça marche — Scénario complet

> **Lotfi Bougrine (élève) envoie un signalement**

### Étape 1 — Lotfi ouvre Firefox

```
FIREFOX
  └── React affiche la page http://localhost:5173
        └── Vite a transformé le TypeScript en JS lisible par Firefox
```

Lotfi voit le formulaire de login. Il tape `eleve@safeschool.com` / `eleve123` et clique **Se connecter**.

---

### Étape 2 — Login

```
FIREFOX
  └── React détecte le clic sur "Se connecter"
        └── Axios envoie :
              POST http://localhost:5000/auth/login
              Body: { email: "eleve@safeschool.com", password: "eleve123" }
                          ↕ HTTP
SERVEUR
  └── NestJS reçoit la requête sur /auth/login
        ├── Passport laisse passer (route publique, pas de vérification)
        ├── AuthService.login() s'exécute
        │     ├── TypeORM cherche : SELECT * FROM users WHERE email = '...'
        │     │         ↕ SQL
        │     │   PostgreSQL retourne Lotfi Bougrine
        │     ├── bcrypt compare "eleve123" avec le hash en BDD
        │     │   → correspondance OK ✅
        │     └── JWT génère un ticket :
        │           "sub:2, email:eleve@safeschool.com, role:student, expire:24h"
        └── NestJS répond :
              { access_token: "eyJhbG...", user: { id:2, role:"student" } }
                          ↕ HTTP
FIREFOX
  └── Axios reçoit la réponse
        └── React (AuthContext) sauvegarde le token dans localStorage
              └── React Router redirige vers /student
```

---

### Étape 3 — Lotfi remplit le formulaire

```
FIREFOX
  └── React Router affiche /student → StudentDashboard
        └── React affiche le formulaire
```

Lotfi tape :

| Champ | Valeur |
|-------|--------|
| Titre | "Harcèlement dans les couloirs" |
| Description | "Un élève m'insulte et me frappe tous les jours" |
| Anonyme | non coché |

Lotfi clique **Envoyer le signalement**.

---

### Étape 4 — Envoi du signalement

```
FIREFOX
  └── React déclenche handleSubmit()
        └── Axios prépare la requête :
              POST http://localhost:5000/reports
              Header: Authorization: Bearer eyJhbG...  ← token ajouté automatiquement
              Body: { title: "Harcèlement...", description: "...", isAnonymous: false }
                          ↕ HTTP
SERVEUR
  └── NestJS reçoit la requête sur POST /reports
        ├── Passport intercepte la requête
        │     ├── Lit le token dans le header Authorization
        │     ├── JWT vérifie la signature du token
        │     ├── Token valide → extrait { sub:2, role:"student" }
        │     └── TypeORM charge l'utilisateur : SELECT * FROM users WHERE id = 2
        │               ↕ SQL
        │         PostgreSQL retourne Lotfi Bougrine ✅
        │
        ├── ReportsController reçoit la requête
        │     └── req.user = Lotfi Bougrine (injecté par Passport)
        │
        └── ReportsService.create() s'exécute
              ├── classifyByIA("Un élève m'insulte et me frappe tous les jours")
              │     ├── Détecte le mot "insulte" → trouvé !
              │     └── Retourne grade = "urgent"
              │
              ├── TypeORM crée le signalement :
              │     INSERT INTO reports (title, grade, status, studentId...)
              │     VALUES ("Harcèlement...", "urgent", "pending", 2)
              │               ↕ SQL
              │     PostgreSQL sauvegarde → retourne id=5 ✅
              │
              └── NestJS répond :
                    { id:5, grade:"urgent", status:"pending", ... }
                          ↕ HTTP
FIREFOX
  └── Axios reçoit la réponse
        └── React met à jour l'affichage :
              setSuccess(report) → affiche la confirmation
```

---

### ✅ Résultat final dans le navigateur

```
✅ Signalement envoyé avec succès !
Grade attribué par l'IA : 🟠 Urgent
Statut : En attente de traitement
```

---

### 🗄️ Ce qui est maintenant en base de données

**Table `users`**

| id | firstName | lastName | email | role |
|----|-----------|----------|-------|------|
| 2 | Lotfi | Bougrine | eleve@safeschool.com | student |

**Table `reports`**

| id | title | grade | status | studentId | isAnonymous |
|----|-------|-------|--------|-----------|-------------|
| 5 | Harcèlement dans les couloirs | urgent | pending | 2 | false |

---

## 🚀 Démarrage rapide

```bash
# 1. Cloner le projet
git clone git@github.com:hydnumrepandum68/ft_transcendence.git safeschool

# 2. Créer le fichier .env
cp .env.example .env

# 3. Lancer tous les services
docker-compose up --build
```

| URL | Service |
|-----|---------|
| http://localhost:5173 | Frontend React |
| http://localhost:5000 | Backend NestJS |
| http://localhost:8080 | pgAdmin (base de données) |

## 👥 Comptes de test

```bash
# Appliquer les données de test
docker-compose exec -T database psql -U postgres safeschool < database/seed.sql
```

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `eleve@safeschool.com` | `eleve123` | student |
| `admin@safeschool.com` | `admin123` | admin |
| `directeur@safeschool.com` | `directeur123` | director |

## 💾 Backup

```bash
# Créer un backup
./backup.sh

# Restaurer un backup
./restore.sh ./backups/safeschool_YYYYMMDD_HHMMSS.sql
```

---

*SafeSchool — Ensemble contre le harcèlement scolaire* 🛡️