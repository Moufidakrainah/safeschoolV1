# API Reference — SafeSchool

> Base URL: `http://localhost:5000` (dev) / `https://localhost:8443/api` (prod)
> All routes except `POST /auth/login` and `POST /auth/register` require the header:
> `Authorization: Bearer <token>`
> The token is obtained via `POST /auth/login` and expires according to the JWT configuration.

**Available roles:** `student` | `teacher` | `staff` | `director` | `admin`

---

## Route Summary

| Method | Route | Access |
|---|---|---|
| POST | /auth/login | public |
| POST | /auth/register | public |
| GET | /users/search | all roles |
| GET | /users | admin, director |
| GET | /users/:id | admin, director, self |
| POST | /users | admin |
| PATCH | /users/:id | admin |
| PATCH | /users/:id/password | admin, self |
| DELETE | /users/:id | admin |
| POST | /reports | student, teacher, staff |
| GET | /reports | student (own) · others (all) |
| GET | /reports/:id | student (own) · others (all) |
| PATCH | /reports/:id | teacher, staff, director, admin |
| PATCH | /reports/:id/escalate | admin |
| GET | /reports/:id/notes | student (convocations only) · others (all) |
| POST | /reports/:id/notes | teacher, staff, director, admin |
| GET | /notifications | self |
| GET | /notifications/unread-count | self |
| PATCH | /notifications/:id/read | self |
| POST | /classes | admin |
| GET | /classes | all roles |
| GET | /classes/:id | all roles |
| PATCH | /classes/:id | admin |
| DELETE | /classes/:id | admin |
| POST | /student-profiles | admin, director |
| GET | /student-profiles | admin, director |
| GET | /student-profiles/:userId | student (own) · admin, director |
| PATCH | /student-profiles/:userId | student (own) · admin |
| POST | /staff-profiles | admin |
| GET | /staff-profiles | admin, director |
| GET | /staff-profiles/:id | all roles |
| PATCH | /staff-profiles/:id | admin |
| DELETE | /staff-profiles/:id | admin |
| POST | /parents | admin |
| GET | /parents | admin, director |
| GET | /parents/:id | admin, director |
| PATCH | /parents/:id | admin |
| DELETE | /parents/:id | admin |

---

## Auth

### `POST /auth/register`
Creates a user account (self-registration).

**Body**
```json
{ "email": "string", "password": "string", "firstName": "string", "lastName": "string" }
```
**Response** `201` — `{ access_token, user: { id, email, role, firstName, lastName } }`

---

### `POST /auth/login`
Authenticates a user and returns a JWT.

**Body**
```json
{ "email": "string", "password": "string" }
```
**Response** `200` — `{ access_token, user: { id, email, role, firstName, lastName } }`
**Errors** `401` invalid credentials

---

## Users

### `GET /users`
Lists all users. Filterable by role, paginated.

**Auth** admin, director
**Query params** `role?` `page?` `limit?` (defaults: page=1, limit=10)
**Response** `{ data: User[], total, page, limit }`

---

### `GET /users/search?q=`
Searches a user by first or last name (min. 2 characters).

**Auth** all roles
**Response** `User[]`

---

### `GET /users/:id`
Returns a user by UUID.

**Auth** admin, director, or the user themselves
**Response** `User`
**Errors** `400` invalid UUID · `403` access denied · `404` not found

---

### `POST /users`
Creates a user (admin-initiated creation).

**Auth** admin only
**Body**
```json
{ "email": "string", "password": "string", "firstName": "string", "lastName": "string", "role": "string", "schoolClass?": "string" }
```
**Response** `201` `User`
**Errors** `409` email already in use

---

### `PATCH /users/:id`
Updates an existing user (all fields optional).

**Auth** admin only
**Body** `{ email?, firstName?, lastName?, role?, schoolClass? }`
**Response** `200` `User`
**Errors** `409` email already taken

---

### `PATCH /users/:id/password`
Changes a user's password.

**Auth** admin (any user) or the user themselves
**Body** `{ "password": "string" }`
**Response** `200` `{ success: true }`

---

### `DELETE /users/:id`
Deletes a user.

**Auth** admin only
**Response** `200` `{ success: true }`

---

## Reports

### `POST /reports`
Creates a report.

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
**Response** `201` `Report`

---

### `GET /reports`
Lists reports.

**Auth** all
**Behavior** student → their own reports only · other roles → all reports
**Response** `Report[]`

---

### `GET /reports/:id`
Returns a report by UUID.

**Auth** all · student limited to their own reports
**Response** `Report`

---

### `PATCH /reports/:id`
Updates a report's status, grade, or admin note.

**Auth** teacher, staff, director, admin
**Body** `{ status?, grade?, adminNote?, gradeModificationReason? }`
**Status values** `pending` | `in_progress` | `escalated` | `closed` | `rejected`
**Grade values** `critical` | `high` | `medium` | `low`
**Response** `200` `Report`

---

### `PATCH /reports/:id/escalate`
Escalates a report.

**Auth** admin only
**Response** `200` `Report`

---

### `GET /reports/:id/notes`
Lists the notes on a report.

**Auth** all · student: only convocations that concern them
**Response** `Note[]`

---

### `POST /reports/:id/notes`
Adds a note to a report.

**Auth** teacher, staff, director, admin
**Body** `{ "content": "string", "type": "note"|"convocation", "targetRole?": "string" }`
**Response** `201` `Note`

---

## Notifications

### `GET /notifications`
Lists the notifications of the authenticated user.

**Auth** all
**Response** `Notification[]`

---

### `GET /notifications/unread-count`
Number of unread notifications.

**Auth** all
**Response** `{ count: number }`

---

### `PATCH /notifications/:id/read`
Marks a notification as read.

**Auth** all
**Response** `{ success: true }`

---

## Classes

### `GET /classes`
Lists all classes.

**Auth** all
**Response** `SchoolClass[]`

---

### `GET /classes/:id`
Returns a class by UUID.

**Auth** all
**Response** `SchoolClass`

---

### `POST /classes`
Creates a class.

**Auth** admin
**Body** `{ "level": "string", "section": "string" }`
**Response** `201` `SchoolClass`

---

### `PATCH /classes/:id`
Updates a class.

**Auth** admin
**Body** `{ level?, section? }`
**Response** `200` `SchoolClass`

---

### `DELETE /classes/:id`
Deletes a class.

**Auth** admin
**Response** `200`

---

## Student Profiles

### `GET /student-profiles`
Lists all student profiles.

**Auth** admin, director

---

### `GET /student-profiles/:userId`
Returns the profile of a student (including their parents).

**Auth** admin, director, or the student themselves

---

### `GET /student-profiles/parents/:userId`
Returns only the parents of a student.

**Auth** admin, director, or the student themselves

---

### `POST /student-profiles`
Creates a student profile.

**Auth** admin
**Body** `{ "userId": "uuid", "schoolClass": "string", "dateOfBirth": "string" }`

---

### `PATCH /student-profiles/:userId`
Updates a student profile.

**Auth** admin, or the student themselves
**Body** `{ parentEmail?, parentPhone?, schoolClass?, dateOfBirth? }`

---

## Staff Profiles

### `GET /staff-profiles`
Lists all staff profiles.

**Auth** admin, director

---

### `GET /staff-profiles/:id`
Returns a staff profile by profile ID.

**Auth** all

---

### `GET /staff-profiles/by-user/:userId`
Returns the staff profile of a user by userId.

**Auth** admin, director, or the user themselves

---

### `POST /staff-profiles`
Creates a staff profile.

**Auth** admin
**Body** `{ "userId": "uuid", "profession": "string", "subject?": "string", "classIds?": ["uuid"] }`

---

### `PATCH /staff-profiles/:id`
Updates a staff profile.

**Auth** admin
**Body** `{ profession?, subject?, classIds? }`

---

### `DELETE /staff-profiles/:id`
Deletes a staff profile.

**Auth** admin

---

## Parents

### `GET /parents`
Lists all parents.

**Auth** admin, director

---

### `GET /parents/:id`
Returns a parent by UUID.

**Auth** admin, director

---

### `POST /parents`
Creates a parent record.

**Auth** admin
**Body** `{ "firstName": "string", "lastName": "string", "email": "string", "phone?": "string", "address?": "string", "studentIds?": ["uuid"] }`

---

### `PATCH /parents/:id`
Updates a parent record.

**Auth** admin
**Body** `{ firstName?, lastName?, email?, phone?, address?, studentIds? }`

---

### `DELETE /parents/:id`
Deletes a parent record.

**Auth** admin

---

## WebSocket — Real-time Quiz

**Connection URL**: `ws://localhost:5000` (Socket.io)

| Event emitted (client → server) | Payload | Description |
|---|---|---|
| `quiz:room:join` | `{ roomId, playerName? }` | Join a room |
| `quiz:room:leave` | `{ roomId }` | Leave a room |
| `quiz:game:start` | `{ roomId }` | Start the game (host only) |
| `quiz:answer:submit` | `{ roomId, questionId, selectedIndex }` | Submit an answer |

| Event received (server → client) | Payload | Description |
|---|---|---|
| `quiz:room:update` | `RoomSnapshot` | Room update (players, status) |
| `quiz:room:closed` | `{ roomId }` | Room closed (host disconnected) |
| `quiz:question` | `QuestionSnapshot` | New question |
| `quiz:question:reveal` | `{ correctIndex, roomSnapshot, revealEndsAt }` | Answer reveal |
| `quiz:score:update` | `RoomSnapshot` | Score update |
| `quiz:game:over` | `RoomSnapshot` | Game over with final leaderboard |

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
