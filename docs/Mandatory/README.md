*This project has been created as part of the 42 curriculum by eguthman, mdoan, mobougri, quclaque.*


## Description

**SafeSchool** is a web platform for managing school harassment reports in middle schools. Students can report harassment situations they witness or experience. Each report is automatically graded by severity with AI assistance, then routed to and handled by the school's administrative staff (teachers, supervisors, directors).

### Key Features

- Report submission and triage, with AI-assisted severity scoring and sentiment analysis of report descriptions
- Role-based dashboards for students, reporting staff, and administrators, including full CRUD on users, classes and reports
- Organization system: schools structured into classes, with students, parents and staff linked to them
- Real-time multiplayer awareness quiz about school harassment, with leaderboard, spectator mode and remote play across devices
- Notification system for report status changes, quiz invitations and other key events
- Multilingual interface (French / English / German) tested across Chrome, Firefox and Edge
- Installable Progressive Web App (PWA) with offline support
- Centralized log management and monitoring via the ELK stack (Elasticsearch, Logstash, Kibana)

<!-- TODO équipe : relire/ajuster cette description et cette liste pour qu'elles correspondent exactement au périmètre livré -->


## Instructions

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Docker | 29+ | <!-- TODO : verifier version PC ecoles --> |
| Docker Compose | v2+ | Use `docker compose`, not `docker-compose` |
| Make | 4.3+ | <!-- TODO équipe : confirmer la version utilisée par l'équipe --> |
| Git | 2.x | To clone the repository |

### Environment Setup

`.env.example` documents every variable the stack needs without exposing real values — copy it to `.env` and fill in your own:

```bash
cp .env.example .env
```

| Variable | Purpose |
|----------|---------|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection |
| `BACKEND_PORT` | Backend (NestJS) listening port |
| `JWT_SECRET` | Secret used to sign authentication tokens — set a real random value |
| `REACT_APP_API_URL` | URL the frontend uses to reach the backend API |
| `GROQ_API_KEY` | API key for the Groq LLM used in AI report scoring/sentiment analysis — <!-- TODO équipe : expliquer comment obtenir une clé et confirmer le comportement de fallback si elle est absente --> |
| `AI_ENABLED` | Toggles the AI scoring feature on/off |
| `LOGSTASH_HOST` / `LOGSTASH_PORT` / `LOG_LEVEL` | Log shipping configuration for the ELK stack |

### Run the Project

```bash
# Clone the repository
git clone <!-- TODO équipe : URL du dépôt de livraison -->
cd <!-- TODO équipe : nom du dossier -->

# Start all services
make all

# Seed the database (optional, for development data)
make seed
```

### Stop the Project

```bash
make down       # Stop containers
make fclean     # Stop + remove volumes (⚠️ deletes all data)
```

---

## Resources

### References

- [React documentation](https://react.dev)
- [NestJS documentation](https://nestjs.com)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Docker documentation](https://docs.docker.com)
- [TypeORM documentation](https://typeorm.io)
- [Socket.IO documentation](https://socket.io/docs/v4/)
- [Elastic (ELK) documentation](https://www.elastic.co/guide/index.html)
- [Color contrast checker](https://www.acquia.com/fr/products/acquia-web-governance/tools/color-contrast-checker)
- [React Beginner Course 2025 : Vite, Tailwind CSS, TypeScript](https://www.youtube.com/watch?v=siTUv1L9ymM&list=PLB_GSA94AMIyqIOyeRolfvuaxr2rA_52j&index=2)
- Studies on school harassment used to ground the awareness quiz and report grading — see [`Additional/project/resources.md`](../Additional/project/resources.md) for the full list (éducation nationale, e-Enfance, OECD, etc.)
- <!-- TODO équipe : ajouter vos références spécifiques (NestJS docs déjà listées plus haut, tutoriels suivis, articles, etc.) -->

### AI Usage

AI tools were used during this project both **as a feature of the application** and **as a development aid**:

- **In the product**: report descriptions are scored and graded by severity with AI assistance (see the [Sentiment analysis](#modules) module — `backend/src/reports/scoring.service.ts`, Groq API), to help staff triage incoming reports faster.
- **In development**:
  - Drafting and restructuring project documentation (this README, the [`Additional/`](../Additional/) knowledge base) — always reviewed and corrected by the team before being kept.
  - <!-- TODO équipe : compléter avec vos usages réels (debug, revue de code, génération de tests, recherche de librairies, etc.) en précisant l'outil et la tâche -->

<!-- TODO équipe : le sujet insiste sur l'honnêteté et la compréhension réelle du contenu généré — soyez précis sur QUI a utilisé quoi et pour QUELLE tâche, vous devrez le justifier à l'oral -->

---

## Team Information

### 1. Product Owner — mdoan

Defines what the product should do and why. Works closely with the team to make sure the right features are prioritized, prevents scope creep, and adapts priorities based on progress and obstacles.

- Define the product vision and goals.
- Translate project requirements into prioritized tasks.
- Document decisions and feature evolution.
- Manage scope and keep expectations realistic.

---

### 2. Project Manager / Scrum Master — eguthman

Ensures the project runs smoothly. Manages the schedule, organizes regular check-ins, removes obstacles, and keeps the team aligned on priorities.

- Coordinate the team's tasks and workflow.
- Organize and facilitate meetings.
- Track progress and identify blockers.
- Ensure clear communication within the team.
- Document processes and decisions.

---

### 3. Technical Leads / Architects — quclaque & mobougri

Frontend expertise — architecture decisions, framework choices, UI/UX patterns, state management.
Backend expertise — API design, database schema, real-time layer (WebSocket), deployment.

Responsibilities:
- Establish coding standards and best practices.
- Review critical code changes (quality assurance).
- Arbitrate diverging implementation approaches.
- Ensure consistency across the codebase.

---

No exclusive technical or managerial ownership: every team member contributes to the code as well as to the coordination and organization of the collective work.

| Member | Main role | Technical specialty |
|--------|-----------|---------------------|
| eguthman | Project Manager | Frontend |
| mdoan | Product Owner | Frontend |
| quclaque | Technical Lead | Backend |
| mobougri | Technical Lead | Backend |

---

## Project Management

### Organization

The team held a recurring meeting (most weeks, alternating solo / pair / whole-team work sessions in between — see the minutes archived in [`Additional/meetings/`](../Additional/meetings/)). Each session reviewed progress against the GitHub project board, re-prioritized the backlog, and re-weighted any new work item over 2 hours with the whole team before starting it.

<!-- TODO équipe : préciser le rythme exact (hebdo ?), comment les sprints/jalons étaient définis, et comment le travail était distribué entre membres -->

### Tools

- **GitHub Issues & Projects** — backlog, task tracking and assignment (see the module list in [Modules](#modules), each linked to its tracking issue)
- **GitHub Pull Requests** — code review workflow (self-assign, designate relevant reviewers, mergeable by the author once at least one approval is given)
- **Git worktrees** — used during the final sprint to parallelize work without branch-switching overhead (see [`Additional/process/git-worktrees.md`](../Additional/process/git-worktrees.md))

### Communication

- **Slack** — day-to-day quick exchanges and sharing of important information
- **GitHub** (issues / PR comments) — async, traceable technical discussions

<!-- TODO équipe : confirmer/compléter (Discord ? réunions en présentiel/visio ?) -->

---

## Technical Stack

**Frontend :** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Axios, Socket.io-client, i18next, Recharts

**Backend :** NestJS 11, TypeScript, TypeORM, PostgreSQL (driver `pg`), Passport/JWT, bcrypt, Socket.io, Winston, class-validator

**Database :** PostgreSQL 15

**Infrastructure:** Docker Compose, ELK Stack (Elasticsearch + Logstash + Kibana) 8.12

**Dev tools:** ESLint, Prettier, Jest


### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | ~5.9 | Type safety |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | 4 | Component library |
| react-router-dom | 7 | Client-side routing |
| socket.io-client | 4 | Real-time communication |
| i18next | 26 | Internationalization |
| recharts | 3 | Charts & data visualization |
| lucide-react | 1 | Icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11 | Backend framework (modules, controllers, services, guards, pipes, dependency injection) |
| TypeScript | ~5.7 | Type safety |
| TypeORM | 0.3 | ORM — maps `*.entity.ts` classes to PostgreSQL tables |
| socket.io | 4 | Real-time communication (quiz, notifications) |
| Passport / @nestjs/jwt | — | Authentication (JWT strategy + guards) |
| bcrypt | 6 | Password hashing & salting |
| class-validator / class-transformer | — | DTO validation on incoming requests |
| Winston (+ Logstash transport) | 3 | Structured logging, shipped to the ELK stack |
| Multer | — | File upload handling (avatars) |

### Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 15 | Main relational database |

**Why PostgreSQL?**

The data model is strongly relational: a report links a student, one or more suspects and victims, notes, classes, staff and parents, with cascading and nullable relations between them (see [Database Schema](#database-schema)). PostgreSQL's mature support for foreign keys, constraints, enums and transactions fits this naturally, and TypeORM's PostgreSQL driver is first-class. Version 15 was used as a stable, well-documented LTS release that runs cleanly in a Docker container alongside the rest of the stack.

### Infrastructure & Logging

| Technology | Purpose |
|-----------|---------|
| Docker / Docker Compose | Containerization |
| Elasticsearch 8.12 | Log storage & search |
| Logstash 8.12 | Log ingestion pipeline |
| Kibana 8.12 | Log visualization |

### Justification for Major Technical Choices

- **React** — the subject (v21.1) requires a modern JavaScript frontend framework; React was chosen for its mature TypeScript ecosystem (official types, strong tooling support) and quality official documentation (`react.dev`).
- **NestJS over Express** — Express is minimal: it only routes HTTP requests, leaving architecture, dependency injection, validation and authentication to be designed from scratch. NestJS imposes a clear architecture (modules, controllers, services, guards, pipes, interceptors), which is a real advantage for a multi-person team — everyone knows where code belongs — and its built-in dependency injection makes services unit-testable without tight coupling.
- **TypeORM** — keeps the database schema in sync with TypeScript entity classes (`*.entity.ts`), giving compile-time safety on queries and relations instead of hand-written SQL strings.
- **JWT + bcrypt** — stateless authentication (the backend verifies token signatures without a DB round-trip) combined with salted password hashing that's never reversible, satisfying the subject's "hashed, salted" requirement.
- **Docker Compose** — the stack needs many components (Node.js, PostgreSQL, Elasticsearch...); without containers each developer would install different versions locally, causing incompatibilities. Compose gives identical, isolated environments on every machine and a single-command startup, as required by the subject.
- **ELK (Elasticsearch, Logstash, Kibana)** — chosen as the Devops module to centralize logs from every service (backend via Winston, infrastructure) into searchable, visualized dashboards rather than scattered container logs.

<!-- TODO équipe : compléter si d'autres choix structurants méritent d'être justifiés (i18n, design system, choix du quiz comme "jeu", etc.) -->

---

## Database Schema

All tables use UUID primary keys and are managed through TypeORM entities (`backend/src/**/*.entity.ts`).

### Tables and Relationships

```
users (role: student | teacher | staff | director | admin)
  ├── id (PK, uuid)
  ├── email (unique), password (hashed, select: false), firstName, lastName, avatar
  ├── 1—1 → student_profiles (if role = student)
  ├── 1—1 → staff_profiles (if role = staff/teacher/director)
  └── 1—N → reports (as the reporting student)

student_profiles
  ├── id (PK), dateOfBirth
  ├── N—1 → classes        (current class, nullable)
  ├── 1—1 → users
  └── N—N → parents

staff_profiles
  ├── id (PK), profession, subject
  ├── 1—1 → users
  └── N—N → classes        (classes a staff member supervises/teaches)

classes
  ├── id (PK), level, section
  ├── 1—N → student_profiles
  └── N—N → staff_profiles

parents
  ├── id (PK), firstName, lastName, email, phone, address
  └── N—N → student_profiles

reports
  ├── id (PK), caseNumber (unique), type, description, grade (enum), status (enum)
  ├── aiScore, aiReason, isAnonymous
  ├── N—1 → users           (reporting student)
  ├── 1—N → report_suspects  (cascade delete)
  └── 1—N → report_victims   (cascade delete)

report_suspects / report_victims
  ├── id (PK), freeText, ...
  ├── N—1 → reports          (cascade delete)
  └── N—1 → users            (resolvedUserId, nullable, set null on delete)

report_notes
  ├── id (PK), content, type
  ├── N—1 → reports          (cascade delete)
  └── N—1 → users            (author, nullable, set null on delete)

notifications
  ├── id (PK), message, isRead
  ├── N—1 → users            (cascade delete)
  └── N—1 → reports          (nullable, cascade delete)
```

### Key Fields and Data Types

| Table | Field | Type | Description |
|-------|-------|------|-------------|
| users | id | UUID | Primary key |
| users | email | varchar, unique | Login identifier |
| users | password | varchar (hashed, `select: false`) | bcrypt hash, never returned by default queries |
| users | role | enum (`UserRole`) | student / teacher / staff / director / admin — drives permissions |
| reports | grade | enum (`ReportGrade`) | Severity grade computed from the AI scoring service |
| reports | status | enum (`ReportStatus`) | Lifecycle state of a report (default: `NEW`) |
| reports | aiScore / aiReason | float / text | Output of the AI severity scoring (`scoring.service.ts`) |
| classes | level / section | varchar | e.g. "6e" / "A" — identifies a school class |

<!-- TODO équipe : ajouter un schéma ER visuel (ex. export dbdiagram.io / Mermaid) si possible — voir Additional/manuel-reference-projet.md §Mermaid pour la syntaxe déjà explorée -->

---

## Features List

| Feature | Description | Team member(s) |
|---------|-------------|---------------|
| Authentication | Email/password signup & login secured with bcrypt + JWT, route guards by role | <!-- login --> |
| Report management | Students submit harassment reports (with optional anonymity); staff triage, grade, annotate (notes) and update report status | <!-- login --> |
| AI severity scoring & sentiment analysis | Each report is automatically scored and graded by severity, combining rule-based heuristics with AI sentiment analysis of the description | <!-- login --> |
| User & role management | Admins can view/edit/delete users and manage roles (student, teacher, staff, director, admin) with role-specific dashboards | <!-- login --> |
| Organization system | Schools structured into classes; students, parents and staff are linked to classes with create/read/update support | <!-- login --> |
| Real-time awareness quiz | Multiplayer quiz on harassment-prevention knowledge, playable remotely, with live leaderboard and spectator mode | <!-- login --> |
| Notification system | Real-time notifications for report status changes, quiz invitations and other key events | <!-- login --> |
| Custom design system / UI kit | Reusable component library (10+ components) with a defined color palette, typography and icons | <!-- login --> |
| Internationalization | Full UI translation across French, English and German with a language switcher | <!-- login --> |
| Progressive Web App | Installable, offline-capable frontend (service worker, manifest) | <!-- login --> |
| Advanced search | Filtering, sorting and pagination over reports/users | <!-- login --> |
| Privacy Policy & Terms of Service | Accessible, project-specific legal pages (footer links) | <!-- login --> |
| Activity analytics dashboard | Visual insights into user activity (charts, stats) | <!-- login --> |
| Centralized logging (ELK) | Backend logs shipped via Winston/Logstash to Elasticsearch and visualized in Kibana dashboards | <!-- login --> |

<!-- TODO équipe : assigner les logins (un ou plusieurs par ligne), ajuster les libellés/descriptions si besoin pour coller exactement au périmètre livré -->

---

## Modules

| Module | Category | Type | Points | Description / justification | Team member(s) |
|--------|----------|------|--------|------------------------------|---------------|
| Use a framework for both frontend and backend | Web | Major | 2 | React (frontend) + NestJS (backend) — see [Justification for Major Technical Choices](#technical-stack) | <!-- login --> |
| Real-time features — WebSockets (Quiz) | Web | Major | 2 | Live multiplayer quiz state, scoring and leaderboard pushed over Socket.io with graceful reconnection (`quiz-realtime` module) | <!-- login --> |
| ORM database (TypeORM) | Web | Minor | 1 | All persistence goes through TypeORM entities mapped to PostgreSQL tables | <!-- login --> |
| Advanced search functionality | Web | Minor | 1 | Filtering, sorting and pagination on report/user listings | <!-- login --> |
| Progressive Web App (PWA) | Web | Minor | 1 | Installable app with offline support via service worker + manifest | <!-- login --> |
| 10 reusable components — Custom design system | Web | Minor | 1 | Component library with a defined color palette, typography and icons (see [`Additional/design/design-system.md`](../Additional/design/design-system.md)) | <!-- login --> |
| Notification system | Web | Minor | 1 | Real-time notifications for report status changes, quiz invites, etc. | <!-- login --> |
| Sentiment analysis on report descriptions | Artificial Intelligence | Minor | 1 | AI-assisted sentiment analysis feeding into the report severity score (`scoring.service.ts`) | <!-- login --> |
| Support 3 languages (i18n — fr/en/de) | Accessibility & i18n | Minor | 1 | Full UI translation (FR/EN/DE) with a language switcher, all user-facing text translatable | <!-- login --> |
| Support 3 browsers | Accessibility & i18n | Minor | 1 | Tested and fixed on Chrome + 2 additional browsers — see [`Additional/technical/additionalBrowsers.md`](../Additional/technical/additionalBrowsers.md) | <!-- login --> |
| Advanced permissions system (CRUD) | User Management | Major | 2 | Admins can view/edit/delete users and manage roles (student, teacher, staff, director, admin), with role-specific views and actions | <!-- login --> |
| Organization system | User Management | Major | 2 | Schools structured into classes; create/read/update of classes, with students, parents and staff linked to them | <!-- login --> |
| User activity analytics dashboard | User Management | Minor | 1 | Visual insights into user/report activity | <!-- login --> |
| Implement a complete web-based game (Quiz) | Gaming & UX | Major | 2 | The real-time awareness quiz serves as the project's "game": clear rules, scoring and win conditions, live multiplayer matches | <!-- login --> |
| Remote players | Gaming & UX | Major | 2 | Two or more players can join the same quiz session from separate computers, with reconnection handling | <!-- login --> |
| Multiplayer game (3+ players) | Gaming & UX | Major | 2 | Quiz sessions support 3+ simultaneous participants with synchronized state | <!-- login --> |
| Spectator mode | Gaming & UX | Minor | 1 | Users can watch ongoing quiz sessions in real time | <!-- login --> |
| Infrastructure for log management (ELK) | Devops | Major | 2 | Elasticsearch + Logstash + Kibana pipeline for centralized backend logs (Winston transport), with dashboards — see [`Additional/technical/elk.md`](../Additional/technical/elk.md) | <!-- login --> |

**Total: 8 Major × 2 + 10 Minor × 1 = 26 pts** (minimum required: 14 pts — the surplus beyond 14 may count as bonus, capped at +5 pts per the subject's Bonus part)

<!-- TODO équipe :
  - assigner les logins par module
  - vérifier que chaque module est démontrable intégralement à l'éval (sinon = 0 pt, cf. sujet chap. IV)
  - si certains modules listés ci-dessus ne sont finalement pas livrés, les retirer et recalculer le total
-->

---

## Individual Contributions

<!-- TODO équipe (important) : le sujet est explicite — chaque membre doit pouvoir EXPLIQUER et JUSTIFIER sa propre contribution à l'oral. Ne décrivez que ce que vous avez réellement fait et comprenez en profondeur. -->

### eguthman

- <!-- feature / module / component -->
- <!-- challenges faced and how they were overcome -->

### mdoan

- <!-- feature / module / component -->
- <!-- challenges faced and how they were overcome -->

### mobougri

- <!-- feature / module / component -->
- <!-- challenges faced and how they were overcome -->

### quclaque

- <!-- feature / module / component -->
- <!-- challenges faced and how they were overcome -->

---

## Additional Information

For deeper documentation beyond what's required here — design process, technical deep-dives, meeting minutes, dev workflow, project vision and more — see [`docs/Additional/`](../Additional/).

### Known Limitations

<!-- TODO équipe : lister les limites connues constatées en fin de projet (ex. fonctionnalités partielles, contraintes de temps, choix assumés). À déterminer juste avant la livraison — voir TODO.md pour les derniers points en suspens. -->

- <!-- limitation 1 -->

### License

This project was created as part of the 42 School curriculum (common core, "ft_transcendence") and is intended for educational and evaluation purposes only.

<!-- TODO équipe : confirmer s'il faut une licence plus formelle (ex. MIT) ou si la mention 42 ci-dessus suffit -->

### Credits

*This project has been created as part of the 42 curriculum by eguthman, mdoan, mobougri, quclaque.*
