# API Reference — SafeSchool

> Base URL : `http://localhost:5000` (dev) / `https://<domain>` (prod)  
> Toutes les routes sauf `POST /auth/login` et `POST /auth/register` nécessitent un header :  
> `Authorization: Bearer <token>`  
> Le token est obtenu via `POST /auth/login` et expire selon la config JWT.

**Rôles disponibles :** `student` | `teacher` | `staff` | `director` | `admin`

---

## Auth

### `POST /auth/register`
Crée un compte utilisateur (auto-inscription).

**Body**
```json
{ "email": "string", "password": "string", "firstName": "string", "lastName": "string" }
```
**Réponse** `201` — `{ access_token, user: { id, email, role, firstName, lastName } }`

---

### `POST /auth/login`
Authentifie un utilisateur et retourne un JWT.

**Body**
```json
{ "email": "string", "password": "string" }
```
**Réponse** `200` — `{ access_token, user: { id, email, role, firstName, lastName } }`  
**Erreurs** `401` identifiants invalides

---

## Users

### `GET /users`
Liste tous les utilisateurs. Filtrable par rôle, paginable.

**Auth** admin, director  
**Query params** `role?` `page?` `limit?` (défaut : page=1, limit=10)  
**Réponse** `{ data: User[], total, page, limit }`

---

### `GET /users/search?q=`
Recherche un utilisateur par prénom ou nom (min. 2 caractères).

**Auth** tous les rôles  
**Réponse** `User[]`

---

### `GET /users/:id`
Retourne un utilisateur par son UUID.

**Auth** admin, director, ou l'utilisateur lui-même  
**Réponse** `User`  
**Erreurs** `400` UUID invalide · `403` accès refusé · `404` introuvable

---

### `POST /users`
Crée un utilisateur (création par l'admin).

**Auth** admin uniquement  
**Body**
```json
{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", "role": "string", "schoolClass?": "string" }
```
**Réponse** `201` `User`  
**Erreurs** `409` email déjà utilisé

---

### `PATCH /users/:id`
Modifie un utilisateur existant (tous champs optionnels).

**Auth** admin uniquement  
**Body** `{ email?, firstName?, lastName?, role?, schoolClass? }`  
**Réponse** `200` `User`  
**Erreurs** `409` email déjà pris

---

### `PATCH /users/:id/password`
Change le mot de passe.

**Auth** admin (n'importe quel user) ou l'utilisateur lui-même  
**Body** `{ "password": "string" }`  
**Réponse** `200` `{ success: true }`

---

### `DELETE /users/:id`
Supprime un utilisateur.

**Auth** admin uniquement  
**Réponse** `200` `{ success: true }`

---

## Reports (Signalements)

### `POST /reports`
Crée un signalement.

**Auth** student, teacher, staff  
**Body**
```json
{
  "title": "string",
  "description": "string",
  "isAnonymous": false,
  "suspects?": [{ "userId?": "uuid", "freeText?": "string" }],
  "frequency?": "string",
  "schoolClass?": "string"
}
```
**Réponse** `201` `Report`

---

### `GET /reports`
Liste les signalements.

**Auth** tous  
**Comportement** student → uniquement ses propres signalements · autres rôles → tous  
**Réponse** `Report[]`

---

### `GET /reports/:id`
Retourne un signalement par UUID.

**Auth** tous · student limité à ses propres signalements  
**Réponse** `Report`

---

### `PATCH /reports/:id`
Met à jour le statut, grade, note admin d'un signalement.

**Auth** teacher, staff, director, admin  
**Body** `{ status?, grade?, adminNote?, gradeModificationReason? }`  
**Valeurs status** `pending` | `in_progress` | `escalated` | `closed` | `rejected`  
**Valeurs grade** `critical` | `high` | `medium` | `low`  
**Réponse** `200` `Report`

---

### `PATCH /reports/:id/escalate`
Escalade un signalement.

**Auth** admin uniquement  
**Réponse** `200` `Report`

---

### `GET /reports/:id/notes`
Liste les notes d'un signalement.

**Auth** tous · student : uniquement les convocations le concernant  
**Réponse** `Note[]`

---

### `POST /reports/:id/notes`
Ajoute une note à un signalement.

**Auth** teacher, staff, director, admin  
**Body** `{ "content": "string", "type": "note"|"convocation", "targetRole?": "string" }`  
**Réponse** `201` `Note`

---

## Notifications

### `GET /notifications`
Liste les notifications de l'utilisateur connecté.

**Auth** tous  
**Réponse** `Notification[]`

---

### `GET /notifications/unread-count`
Nombre de notifications non lues.

**Auth** tous  
**Réponse** `{ count: number }`

---

### `PATCH /notifications/:id/read`
Marque une notification comme lue.

**Auth** tous  
**Réponse** `{ success: true }`

---

## Classes

### `GET /classes`
Liste toutes les classes.

**Auth** tous  
**Réponse** `SchoolClass[]`

---

### `GET /classes/:id`
Retourne une classe par UUID.

**Auth** tous  
**Réponse** `SchoolClass`

---

### `POST /classes`
Crée une classe.

**Auth** admin  
**Body** `{ "level": "string", "section": "string" }`  
**Réponse** `201` `SchoolClass`

---

### `PATCH /classes/:id`
Modifie une classe.

**Auth** admin  
**Body** `{ level?, section? }`  
**Réponse** `200` `SchoolClass`

---

### `DELETE /classes/:id`
Supprime une classe.

**Auth** admin  
**Réponse** `200`

---

## Student Profiles

### `GET /student-profiles`
Liste tous les profils élèves.

**Auth** admin, director

---

### `GET /student-profiles/:userId`
Retourne le profil d'un élève (avec ses parents).

**Auth** admin, director, ou l'élève lui-même

---

### `GET /student-profiles/parents/:userId`
Retourne uniquement les parents d'un élève.

**Auth** admin, director, ou l'élève lui-même

---

### `POST /student-profiles`
Crée un profil élève.

**Auth** admin  
**Body** `{ "userId": "uuid", "schoolClass": "string", "dateOfBirth": "string" }`

---

### `PATCH /student-profiles/:userId`
Met à jour un profil élève.

**Auth** admin, ou l'élève lui-même  
**Body** `{ parentEmail?, parentPhone?, schoolClass?, dateOfBirth? }`

---

## Staff Profiles

### `GET /staff-profiles`
Liste tous les profils staff.

**Auth** admin, director

---

### `GET /staff-profiles/:id`
Retourne un profil staff par son ID de profil.

**Auth** tous

---

### `GET /staff-profiles/by-user/:userId`
Retourne le profil staff d'un utilisateur par son userId.

**Auth** admin, director, ou l'utilisateur lui-même

---

### `POST /staff-profiles`
Crée un profil staff.

**Auth** admin  
**Body** `{ "userId": "uuid", "profession": "string", "subject?": "string", "classIds?": ["uuid"] }`

---

### `PATCH /staff-profiles/:id`
Modifie un profil staff.

**Auth** admin  
**Body** `{ profession?, subject?, classIds? }`

---

### `DELETE /staff-profiles/:id`
Supprime un profil staff.

**Auth** admin

---

## Parents

### `GET /parents`
Liste tous les parents.

**Auth** admin, director

---

### `GET /parents/:id`
Retourne un parent par UUID.

**Auth** admin, director

---

### `POST /parents`
Crée un parent.

**Auth** admin  
**Body** `{ "firstName": "string", "lastName": "string", "email": "string", "phone?": "string", "address?": "string", "studentIds?": ["uuid"] }`

---

### `PATCH /parents/:id`
Modifie un parent.

**Auth** admin  
**Body** `{ firstName?, lastName?, email?, phone?, address?, studentIds? }`

---

### `DELETE /parents/:id`
Supprime un parent.

**Auth** admin

---

## WebSocket — Quiz temps réel

**URL de connexion** : `ws://localhost:5000` (Socket.io)

| Événement émis (client → serveur) | Payload | Description |
|---|---|---|
| `quiz:room:join` | `{ roomId, playerName? }` | Rejoindre une room |
| `quiz:room:leave` | `{ roomId }` | Quitter une room |
| `quiz:game:start` | `{ roomId }` | Démarrer la partie (host uniquement) |
| `quiz:answer:submit` | `{ roomId, questionId, selectedIndex }` | Soumettre une réponse |

| Événement reçu (serveur → client) | Payload | Description |
|---|---|---|
| `quiz:room:update` | `RoomSnapshot` | Mise à jour de la room (joueurs, statut) |
| `quiz:room:closed` | `{ roomId }` | Room fermée (host déconnecté) |
| `quiz:question` | `QuestionSnapshot` | Nouvelle question |
| `quiz:question:reveal` | `{ correctIndex, roomSnapshot, revealEndsAt }` | Révélation de la réponse |
| `quiz:score:update` | `RoomSnapshot` | Mise à jour des scores |
| `quiz:game:over` | `RoomSnapshot` | Fin de partie avec classement |

---

## Types

```ts
type Role = 'student' | 'teacher' | 'staff' | 'director' | 'admin'
type ReportStatus = 'pending' | 'in_progress' | 'escalated' | 'closed' | 'rejected'
type ReportGrade = 'critical' | 'high' | 'medium' | 'low'

interface User {
  id: string        // UUID
  email: string
  firstName: string
  lastName: string
  role: Role
  createdAt: string // ISO 8601
}

interface Report {
  id: string
  title: string
  description: string
  isAnonymous: boolean
  status: ReportStatus
  grade: ReportGrade | null
  adminNote: string | null
  createdAt: string
  student: User
  suspects: ReportSuspect[]
  notes: Note[]
}

interface Note {
  id: string
  content: string
  type: 'note' | 'convocation'
  createdAt: string
  author: { firstName: string; lastName: string }
}

interface Notification {
  id: string
  message: string
  isRead: boolean
  createdAt: string
}

interface SchoolClass {
  id: string
  level: string
  section: string
}
```

