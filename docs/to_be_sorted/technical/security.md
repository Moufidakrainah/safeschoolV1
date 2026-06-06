# Sécurité — vue d'ensemble

> Ce document couvre toutes les protections de sécurité actives dans SafeSchool, organisées par catégorie de menace. Utile pour la soutenance : le jury vérifie que vous comprenez pourquoi chaque mécanisme est là.

---

## Authentification — JWT + Passport

### Principe

HTTP est sans état : le serveur ne se souvient pas de vous entre deux requêtes. JWT résout ça sans stocker de session côté serveur.

### Flux

```
1. POST /auth/login { email, password }
2. NestJS vérifie le mot de passe (bcrypt)
3. NestJS génère un token JWT signé avec JWT_SECRET
4. Le frontend stocke le token (localStorage)
5. Toutes les requêtes suivantes : Authorization: Bearer <token>
6. Passport vérifie la signature → extrait { sub, email, role } → charge le user
```

### Pourquoi le payload JWT est lisible mais sécurisé

Un JWT est en trois parties : `header.payload.signature`. Le payload est encodé en base64 — n'importe qui peut le décoder et lire `{ sub: 42, email: "...", role: "student" }`. La sécurité vient de la **signature** : générée avec `JWT_SECRET` (connu uniquement du serveur). Si quelqu'un modifie le payload, la signature ne correspond plus — NestJS rejette le token.

Ne jamais mettre de données sensibles dans le payload (mot de passe, numéro CB, etc.).

---

## Mots de passe — bcrypt

Les mots de passe ne sont **jamais** stockés en clair. bcrypt applique un hash irréversible avec un salt aléatoire.

```typescript
// À la création du compte
const hash = await bcrypt.hash(password, 10); // 10 = coût (rounds)
// → stocké en BDD : "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmKLCn..."

// À la connexion
const isValid = await bcrypt.compare(passwordSaisi, hashEnBDD);
// → true ou false, jamais le mot de passe en clair
```

Même si la base de données est compromise, les mots de passe restent inaccessibles.

Dans TypeORM, la colonne `password` est marquée `{ select: false }` — elle n'est pas retournée par défaut dans les requêtes `SELECT *`.

---

## Injection SQL — TypeORM

L'injection SQL consiste à glisser du SQL dans un champ utilisateur pour manipuler la requête :
```
email: "admin'--"  →  SELECT * FROM users WHERE email = 'admin'--' AND password = ...
                                                                    ^ tout le reste ignoré
```

TypeORM protège automatiquement via les **paramètres liés** (prepared statements) :

```typescript
// TypeORM traduit ça en requête paramétrée, jamais en concaténation de string
this.usersRepository.findOne({ where: { email } })
// → SELECT * FROM users WHERE email = $1  (avec email passé séparément)
```

**Règle** : ne jamais construire de requête SQL avec des variables non sanitisées. Si vous utilisez `createQueryBuilder`, utilisez toujours `:param` :

```typescript
.where("LOWER(user.firstName) LIKE LOWER(:query)", { query: `%${query}%` }) // ✅
.where(`LOWER(user.firstName) LIKE '%${query}%'`)                            // ❌ injection possible
```

---

## Validation des inputs — ValidationPipe + class-validator

Toute donnée venant du client est non fiable. `ValidationPipe` (activé dans `main.ts`) rejette automatiquement les requêtes dont le body ne correspond pas au DTO.

```typescript
// create-report.dto.ts
export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsBoolean()
  isAnonymous: boolean;
}
```

Si le client envoie un `title` vide ou un `type` invalide → NestJS répond `400 Bad Request` avant même d'atteindre le service. La logique métier ne voit jamais de données malformées.

`whitelist: true` dans la config du pipe supprime silencieusement les champs non déclarés dans le DTO — un attaquant ne peut pas injecter des propriétés non attendues.

---

## XSS (Cross-Site Scripting) — React

XSS : un attaquant fait exécuter du JavaScript malveillant dans le navigateur d'une victime, typiquement en injectant `<script>alert('XSS')</script>` dans un champ affiché à d'autres utilisateurs.

**React échappe automatiquement** tout contenu inséré dans le JSX :

```tsx
// Si userName = "<script>alert('xss')</script>"
<p>{userName}</p>
// React affiche le texte brut, le script n'est PAS exécuté ✅
```

**Exception** : `dangerouslySetInnerHTML` désactive cette protection. À n'utiliser que pour du contenu HTML contrôlé (ex. markdown rendu côté serveur après sanitisation).

---

## CSRF (Cross-Site Request Forgery) — JWT dans les headers

CSRF : un site malveillant fait effectuer une requête à votre API au nom d'un utilisateur connecté.

Ça fonctionne avec les cookies (envoyés automatiquement par le navigateur vers le domaine cible). **JWT dans les headers Authorization ne sont pas envoyés automatiquement** — le JavaScript de la page doit explicitement ajouter le header. Un site tiers ne peut pas accéder au token stocké dans localStorage d'un autre domaine (Same-Origin Policy).

→ En utilisant `Authorization: Bearer <token>` (géré par l'intercepteur Axios), SafeSchool est naturellement protégé contre le CSRF.

---

## Variables d'environnement — secrets hors du code

Aucun credential (mot de passe BDD, JWT_SECRET, clé API) n'est jamais dans le code source.

```
.env           ← valeurs réelles, dans .gitignore (jamais committé)
.env.example   ← clés vides, committé pour que l'équipe sache quoi remplir
```

Si un credential est commité dans git, il faut considérer qu'il est compromis — même après suppression, il reste dans l'historique git.

Accès dans NestJS via `ConfigModule` : `process.env.JWT_SECRET`.

---

## HTTPS — exigence du sujet

La section III.3 du sujet impose :
> "Any connection to the backend, from a browser, from a script, from an external API, etc., must use HTTPS."

Sans HTTPS, les tokens JWT transitent en clair sur le réseau — n'importe qui en position MITM (même réseau WiFi) peut les lire et se faire passer pour l'utilisateur.

HTTPS est géré par nginx (reverse proxy) qui détient le certificat TLS. Les services internes communiquent en HTTP simple sur le réseau Docker privé — c'est acceptable car ce réseau n'est pas accessible depuis l'extérieur.

---

## Récapitulatif — protection par couche

| Menace | Protection | Où |
|---|---|---|
| Mot de passe volé en BDD | bcrypt (hash irréversible) | `auth.service.ts` |
| Token JWT falsifié | Signature HMAC (JWT_SECRET) | `jwt.strategy.ts` |
| Injection SQL | Paramètres liés TypeORM | Toutes les requêtes BDD |
| Input malformé | ValidationPipe + class-validator | DTOs NestJS |
| XSS | Échappement automatique JSX | React (natif) |
| CSRF | JWT dans headers (pas cookies) | Intercepteur Axios |
| Credentials exposés | Variables d'environnement | `.env` + `.gitignore` |
| Écoute réseau | HTTPS via nginx | Infrastructure |
| Accès routes sans auth | JwtAuthGuard | Controllers NestJS |
