!!!! VERIFIER QU'IL NE RESTE PAS DE TODO !!!!

*This project has been created as part of the 42 curriculum by eguthman, mdoan, mobougri, quclaque.*


## <br>Description

**SafeSchool** is a web platform for managing school harassment reports in middle schools. Students and school staff can report harassment situations they witness or experience. Each report is automatically graded by severity with AI assistance, then routed to and handled by the school's administrative staff (teachers, supervisors, directors).

### Key Features

- Report submission and triage, with AI-assisted severity scoring and sentiment analysis of report descriptions
- Role-based dashboards for students, reporting staff, and administrators, including full CRUD on users, classes and reports
- Organization system: schools structured into classes, with students, parents and staff linked to them
- Real-time multiplayer quiz on school-harassment awareness, powered by WebSockets
- Game features include live score updates, leaderboard, and remote play across devices
- Notification system for report status changes, quiz invitations and other key events
- Multilingual interface (French / English / German) tested across Chrome, Firefox and Edge
- Installable Progressive Web App (PWA) with offline support
- Centralized log management and monitoring via the ELK stack (Elasticsearch, Logstash, Kibana)

<!- TODO équipe : relire/ajuster cette description et cette liste pour qu'elles correspondent exactement au périmètre livré -->


## <br><br>Instructions

### Prerequisites

Docker, Docker Compose, Make, Git.

### Environment Setup

`.env.example` documents every variable the stack needs without exposing real values — copy it to `.env` and fill in your own:


| Variable | Purpose |
|----------|---------|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection |
| `BACKEND_PORT` | NestJS listening port |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `REACT_APP_API_URL` | URL the frontend uses to reach the backend API |
| `GROQ_API_KEY` | API key for the Groq LLM used in AI report scoring/sentiment analysis — <!-- TODO équipe : expliquer comment obtenir une clé et confirmer le comportement de fallback si elle est absente --> |
| `AI_ENABLED` | Toggles the AI scoring feature on/off |
| `LOGSTASH_HOST` / `LOGSTASH_PORT` / `LOG_LEVEL` | Log shipping configuration for the ELK stack |

### Run the Project

```bash
# Clone the repository
git clone ...

# Start all services
make all

# The database is seeded automatically on first run if it's empty.
# To force a manual re-seed:
make seed
```

### Stop the Project

```bash
make down       # Stop containers
make fclean     # Stop + remove volumes (deletes all data)
```


## <br><br>Resources

### References

- [NestJS documentation](https://nestjs.com)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Docker documentation](https://docs.docker.com)
- [TypeORM documentation](https://typeorm.io)
- [Socket.IO documentation](https://socket.io/docs/v4/)
- [Elastic (ELK) documentation](https://www.elastic.co/guide/index.html)
- [Color contrast checker](https://www.acquia.com/fr/products/acquia-web-governance/tools/color-contrast-checker)
- [React documentation](https://react.dev)
- [React Beginner Course 2025 : Vite, Tailwind CSS, TypeScript](https://www.youtube.com/watch?v=siTUv1L9ymM&list=PLB_GSA94AMIyqIOyeRolfvuaxr2rA_52j&index=2)
- [Studies on school harassment](../Additional/project/resources.md)
<!- TODO équipe : completez la liste avec quelques sources pertinentes qui vont ont servi au cours du developpement -->

### AI Usage

AI tools were used during this project both **as a feature of the application** and **as a productivity tool**:

- **In the product**: report descriptions are scored and graded by severity with AI assistance to help staff triage incoming reports faster.
- **During the project lifecycle**:
  - Drafting and restructuring project documentation, always reviewed and corrected before being kept.
  - Helping weigh architecture choices and understand the trade-offs between alternatives.
  - Generating boilerplate code, always reviewed by the team and adapted to our needs.
  - Advising on how to prioritize tasks to avoid technical bottlenecks or conflicts.
  - Debugging: explaining obscure error messages and stack traces, suggesting fixes to investigate.
  - Researching and comparing libraries before adopting one.
  - Producing a first draft of UI translations (FR/EN/DE), reviewed and corrected by the team.
  - Improving technical write-ups: PR descriptions, meeting summaries, issue reports.
  - Rewriting contribution summaries and README sections in English from rough working notes, then manually reviewing and correcting them before publication.
  - General-purpose help with linguistic questions: translation, wording, grammar and tone consistency across the FR/EN/DE interface and documentation.
  <!- TODO équipe : completez avec vos usages réels -->

## <br><br>Team Information

Every team member contributed to the code as well as to the coordination and organization of the collective work.

| Member | Main role | Technical specialty |
|--------|-----------|---------------------|
| eguthman | Project Manager / Scrum Master | Frontend architecture, workflow, infrastructure |
| mdoan | Product Owner | Frontend, API |
| mobougri | Technical Lead | Backend, DB, API |
| quclaque | Technical Lead | Websockets |



### 1. Product Owner — mdoan

<!- TODO mdoan : completer avec une description precise de ton role -->
---

### 2. Project Manager / Scrum Master — eguthman

Coordinated the project workflow, maintained visibility on priorities, and supported the team through planning, documentation and process structure.

- Coordinate the team's tasks and workflow.
- Design and maintain the GitHub project board structure (views, labels, columns, priorities and module tracking).
- Organize and facilitate meetings.
- Prepare meeting agendas in advance and write follow-up meeting minutes to preserve decisions.
- Track progress and identify blockers.
- Establish and document collaboration practices for Git, pull requests and code review.
- Ensure clear communication within the team.
- Document processes and decisions.

---

### 3. Technical Lead 1 — mobougri

<!- TODO mobougri : completer avec une description precise de ton role -->

### 4. Technical Lead 2 — quclaque

<!- TODO quclaque : completer avec une description precise de ton role -->






## <br><br>Project Management

### Organization

The team used a lightweight agile workflow centered on a shared GitHub project board. Work was split into issues, tagged by feature area and targeted module, then tracked through dedicated columns and filtered views to keep priorities and tasks readable at any time.

The team held recurring meetings throughout the project (most weeks, alternating solo / pair / whole-team work sessions in between — see the minutes archived in [`Additional/meetings/`](../Additional/meetings/)). Each session reviewed progress, prioritized the backlog, clarified blockers and was used to share knowledge.

To improve coordination in a team that was discovering full-stack web development for the first time, project management also included documenting Git workflows, introducing pull-request best practices, monitoring board activity continuously, and recording decisions so the team could recover context between work sessions.

<!- TODO équipe : préciser le rythme exact (hebdo ?), comment les sprints/jalons étaient définis, et comment le travail était distribué entre membres -->

### Tools

- **GitHub Issues & Projects** — backlog, task tracking, assignment, labels, module visibility and filtered board views adapted to the project's workflow
- **GitHub Pull Requests** — code review workflow with documented expectations on review, merge readiness and collaboration hygiene
- **Git worktrees** — used during the final sprint to minimize branch-switching overhead (see [`Additional/process/git-worktrees.md`](../Additional/process/git-worktrees.md))

### Communication

- **Slack** — day-to-day coordination, quick questions and sharing urgent information
- **GitHub** (issues / PR comments) — asynchronous, traceable technical discussions and review feedback
- **Meeting agendas and minutes** — written support for coordination, follow-up and decision traceability across the project

<!- TODO équipe : confirmer/compléter (Discord ? réunions en présentiel/visio ?) -->

## <br><br>Technical Stack


### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | — | Component library and UI patterns |
| react-router-dom | 7 | Client-side routing |
| Axios | 1 | HTTP client |
| socket.io-client | 4 | Real-time communication |
| i18next | 26 | Internationalization |
| recharts | 3 | Charts & data visualization |
| lucide-react | 1 | Icon library |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 11 | Backend framework (modules, controllers, services, guards, pipes, dependency injection) |
| TypeScript | 5 | Type safety |
| TypeORM | 0.3 | ORM — maps `*.entity.ts` classes to PostgreSQL tables |
| socket.io | 4 | Real-time communication (quiz, notifications) |
| Passport / @nestjs/jwt | 11 / 4 | Authentication (JWT strategy + guards) |
| bcrypt | 6 | Password hashing & salting |
| class-validator / class-transformer | — | DTO validation on incoming requests |
| Winston | 3 | Structured logging sent to the ELK stack |
| Multer | — | File upload handling (avatars) |

### Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 15 | Main relational database |

### Infrastructure & Logging

| Technology | Purpose |
|-----------|---------|
| Docker / Docker Compose | Containerization |
| Elasticsearch 8.12 | Log storage & search |
| Logstash 8.12 | Log ingestion pipeline |
| Kibana 8.12 | Log visualization |

### Technical Choices

- **React** — the subject (v21.1) requires a modern JavaScript frontend framework; React was chosen for its mature TypeScript ecosystem (official types, strong tooling support) and quality official documentation (`react.dev`).
- **NestJS over Express** — Express is minimal: it only routes HTTP requests, leaving architecture, dependency injection, validation and authentication to be designed from scratch. NestJS imposes a clear architecture (modules, controllers, services, guards, pipes, interceptors), which is a real advantage for a multi-person team — everyone knows where code belongs — and its built-in dependency injection makes services unit-testable without tight coupling.
- **PostgreSQL** — the data model is strongly relational: a report links a student, one or more suspects and victims, notes, classes, staff and parents, with cascading and nullable relations between them (see [Database Schema](#database-schema)). PostgreSQL's support for foreign keys, constraints, enums and transactions fits this naturally, and TypeORM's PostgreSQL driver integrates cleanly with the rest of the stack.
- **TypeORM** — keeps the database schema in sync with TypeScript entity classes (`*.entity.ts`), giving compile-time safety on queries and relations instead of hand-written SQL strings.
- **JWT + bcrypt** — stateless authentication (the backend verifies token signatures without a DB round-trip) combined with salted password hashing that's never reversible, satisfying the subject's "hashed, salted" requirement.
- **Docker Compose** — the stack needs many components (Node.js, PostgreSQL, Elasticsearch...); without containers each developer would install different versions locally, causing incompatibilities. Compose gives identical, isolated environments on every machine and a single-command startup, as required by the subject.
- **ELK (Elasticsearch, Logstash, Kibana)** — chosen as the Devops module to centralize logs from every service (backend via Winston, infrastructure) into searchable, visualized dashboards rather than scattered container logs.

<!- TODO équipe : compléter si d'autres choix structurants méritent d'être justifiés (i18n, design system, choix du quiz comme "jeu", etc.) -->

## <br><br>Database Schema

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

<!- TODO équipe : ajouter un schéma ER visuel (ex. export dbdiagram.io / Mermaid) si possible — voir Additional/manuel-reference-projet.md §Mermaid pour la syntaxe déjà explorée -->

## <br><br>Features List

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

<!- TODO équipe : assigner les logins (un ou plusieurs par ligne), ajuster les libellés/descriptions si besoin pour coller exactement au périmètre livré -->

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

<!- TODO équipe :
  - assigner les logins par module
  - vérifier que chaque module est démontrable intégralement à l'éval (sinon = 0 pt, cf. sujet chap. IV)
  - si certains modules listés ci-dessus ne sont finalement pas livrés, les retirer et recalculer le total
-->


## <br><br>Individual Contributions

<!- TODO équipe (important) : le sujet est explicite — chaque membre doit pouvoir EXPLIQUER et JUSTIFIER sa propre contribution à l'oral. Ne décrivez que ce que vous avez réellement fait et comprenez en profondeur. -->

### eguthman

- Acted as Project Manager / Scrum Master throughout the project. Researched project-management practices suitable for a small 42 team, designed the GitHub board structure, created dedicated views, labels and columns, and maintained a workflow that kept features, modules and priorities visible over time.
- Built a collaboration framework around Git and pull requests. This included learning more advanced Git workflows, documenting them for the team, and introducing pull-request practices intended to make review, integration and ownership clearer.
- Organized recurring meetings, prepared agendas beforehand, and wrote meeting minutes afterward so that decisions, blockers and next actions were consistently recorded.
- Monitored project progress throughout the development cycle and worked on making module tracking more explicit through labels, documentation and board organization.
- Contributed significantly to documentation and team enablement work by studying the subject in depth, researching unfamiliar web-development concepts, and turning that learning into written guidance that could be shared across the team.
- On the technical side, helped steer the frontend toward a more modular structure and introduced Tailwind CSS and shadcn/ui to improve consistency, reuse and implementation speed.
- Later in the project, focused more directly on DevOps and delivery readiness. This included improving the Makefile and Docker Compose setup and working on the ELK integration so that the logging stack could become more usable in practice.
- Main challenge: much of this contribution was centered on coordination, documentation, process and project reliability rather than on end-user feature development. The way this was addressed was by making the work traceable, reusable and directly supportive of the team's ability to deliver.

### mdoan

- To be completed by mdoan: describe concrete features, modules, responsibilities and challenges personally handled.

### mobougri

- To be completed by mobougri: describe concrete features, modules, responsibilities and challenges personally handled.

### quclaque

- To be completed by quclaque: describe concrete features, modules, responsibilities and challenges personally handled.



## <br><br>Additional Information

For deeper documentation beyond what is required here — design process, technical deep-dives, meeting minutes, dev workflow, project vision and more — see [`docs/Additional/`](../Additional/).

### Known Limitations

<!- TODO équipe : lister les limites connues constatées en fin de projet (ex. fonctionnalités partielles, contraintes de temps, choix assumés). À déterminer juste avant la livraison — voir TODO.md pour les derniers points en suspens. -->

### License

This project was created as part of the 42 School curriculum (common core, "ft_transcendence") and is intended for educational and evaluation purposes only.
