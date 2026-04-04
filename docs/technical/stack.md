# Technical Stack

## Frontend
React + Vitre + TypeScript
Port : 5137
Role : Interface utilisateur

## Backend
NestJS(Node.js)
Port : 5000
Role : API REST + Logique metier

## Database
PostgreSQL
ORM : TypeORM 
Role : Acces base de données

## Orchestration
Docker + Docker compose 
Role : Gestion des conteneurs

## Auth
JWT + Passport.js 
Role : Authentification et roles

--------------------------------------------------------------
TypeScript : JavaScript avec des règles.
Node.js : JavaScript hors du navigateur.
NestJS : L'organisateur du backend (framework).
React : Le constructeur de page Web (framework).
Vite : Le preparateur du code React, le navigateur ne comprends pas directement TypeScript ou les composants React. Vite transforme tous ça en HTML/CSS/JavaScript que firefox peut lire.
TypeORM : le traducteur entre TypeScript et la base de données
Sans TypeORM tu dois écrire du SQL manuellement :
sqlSELECT * FROM users WHERE email = 'test@test.com';
Avec TypeORM tu écris en TypeScript et il traduit tout seul :
typescriptthis.usersRepository.findOne({ where: { email: 'test@test.com' } });
TypeORM traduit automatiquement en SQL.
PostgreSQL: c'est la base de données.
Docker : Les boites isolés. Docker met chaque service dans une boîte isolée (conteneur) avec tout ce dont il a besoin .
JWT: Quand tu te connecte, le serveur te donne un ticket signé(le token JWT), tu presentes ce ticket a chaque requete pour prouver qui tu es. 
Le serveur n'a pas besoin de mémoriser qui est connecté — il vérifie juste le ticket.
bcrypt: On ne stocke jamais un mot de passe en clair dans la base de données. bcrypt le transforme en une chaîne illisible .
Passport.js : C'est le middleware qui vérifie le JWT à l'entrée de chaque route protégée. Il récupère le token dans le header de la requête, vérifie sa signature, et injecte l'utilisateur dans req.user.
Axios: est la bibliotheque que React utilise pour envoyer des requetes au backend.
React Router : Le gps des pages, sans React Router, changer de page rechargerait toute l'application. React Router gère la navigation sans rechargement.

Scénario:
Lotfi envoie un signalement
étape 1 : Lotfi ouvre Firefox
FIREFOX
  └── React affiche la page http://localhost:5173
        └── Vite a transformé le code TypeScript en JS lisible par Firefox
Lotfi voit le formulaire de login. Il tape eleve@safeschool.com / eleve123 et clique Se connecter.
étape 2: Login
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
        │     │   PostgreSQL retourne l'utilisateur Jean
        │     ├── bcrypt compare "eleve123" avec le hash en BDD
        │     │   → correspondance OK
        │     └── JWT génère un ticket :
        │           "sub:2, email:eleve@safeschool.com, role:student, expire:24h"
        └── NestJS répond :
              { access_token: "eyJhbG...", user: { id:2, role:"student" } }
                          ↕ HTTP
FIREFOX
  └── Axios reçoit la réponse
        └── React (AuthContext) sauvegarde le token dans localStorage
              └── React Router redirige vers /student

étape 3: Lotfi rempli le formulaire

FIREFOX
  └── React Router affiche /student → StudentDashboard
        └── React affiche le formulaire

lotfi tape :
  Titre       : "Harcelement dans les couloirs"
  Description : "Un eleve m insulte et me frappe tous les jours"
  Anonyme     : non coché

lotfi clique "Envoyer le signalement"

étape 4 : Envoi du signalement
FIREFOX
  └── React déclenche handleSubmit()
        └── Axios prépare la requête :
              POST http://localhost:5000/reports
              Header: Authorization: Bearer eyJhbG...  ← token ajouté automatiquement
              Body: { title: "Harcelement...", description: "Un eleve...", isAnonymous: false }
                          ↕ HTTP
SERVEUR
  └── NestJS reçoit la requête sur POST /reports
        ├── Passport intercepte la requête
        │     ├── Lit le token dans le header Authorization
        │     ├── JWT vérifie la signature du token
        │     ├── Token valide → extrait { sub:2, role:"student" }
        │     └── TypeORM charge l'utilisateur : SELECT * FROM users WHERE id = 2
        │               ↕ SQL
        │         PostgreSQL retourne Lotfi BOUGRINE
        │
        ├── ReportsController reçoit la requête
        │     └── req.user = Lotfi BOUGRINE (injecté par Passport)
        │
        └── ReportsService.create() s'exécute
              ├── classifyByIA("Un eleve m insulte et me frappe tous les jours")
              │     ├── Cherche "insulte" → trouvé !
              │     └── Retourne grade = "urgent"
              │
              ├── TypeORM crée le signalement :
              │     INSERT INTO reports (title, description, grade, status, studentId...)
              │     VALUES ("Harcelement...", "Un eleve...", "urgent", "pending", 2)
              │               ↕ SQL
              │     PostgreSQL sauvegarde et retourne le signalement avec id=5
              │
              └── NestJS répond :
                    { id:5, grade:"urgent", status:"pending", ... }
                          ↕ HTTP
FIREFOX
  └── Axios reçoit la réponse
        └── React met à jour l'affichage :
              setSuccess(report) → affiche la confirmation
              "Grade attribué par l'IA : Urgent"
Résultat final dans le navigateur
Signalement envoyé avec succès !
Grade attribué par l'IA : Urgent
Statut : En attente de traitement
Ce qui est maintenant en base de données
BASE DE DONNÉES — PostgreSQL
  └── Table users
        └── id:2 | Bougrine Lotfi | student

  └── Table reports
        └── id:5 | "Harcelement dans les couloirs"
                 | grade: urgent
                 | status: pending
                 | studentId: 2
                 | isAnonymous: false

