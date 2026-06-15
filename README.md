!!!! VERIFIER QU'IL NE RESTE PAS DE TODO !!!!

*This project has been created as part of the 42 curriculum by eguthman, mdoan, mobougri, quclaque.*

---
## Description

**SafeSchool** is a web platform for managing school harassment reports in middle schools. 
Students and teachers can report instances of harassment. Students can be witnesses or victims.
Teachers can only be witnesses. 
Each report is automatically graded by severity with AI assistance, then routed to and handled by the school's administrative staff.

### Key Features

- Report submission and triage, with AI-assisted severity scoring and sentiment analysis of report descriptions
- Customized dashboards for students, teachers, and administrators with different access levels depending on their roles
- Administrators have access to reports, users, and classes (CRUD)
- Teachers have access to their profile, report creation, and quizzes
- Organization system: schools structured into classes, with students, parents and staff linked to them
- Real-time multiplayer quiz on school-harassment awareness, powered by WebSockets
- Game features include live score updates, leaderboard, and remote play across devices
- Notification system for report status changes, quiz invitations and other key events 


!!! TO BE CHECKED Est-ce qu'on a les invitations au quiz ? !!!
<!--  -->


- Multilingual interface (French / English / German) tested across Chrome, Firefox and Edge
- Installable Progressive Web App (PWA) whose static shell is cached for offline loading (backend data still requires a connection)
- Centralized log management and monitoring via the ELK stack (Elasticsearch, Logstash, Kibana)

<!- TODO équipe : relire/ajuster cette description en anglais et cette liste pour qu'elles correspondent exactement au périmètre livré -->

---
## Instructions

### Prerequisites

Docker, Docker Compose, Make, Git.

### Environment Setup

`.env.example` documents every variable the stack needs without exposing real values — copy it to `.env` and fill in your own:


| Variable | Purpose |
|----------|---------|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection |
| `BACKEND_PORT` | NestJS internal listening port |
| `FRONTEND_URL` | Frontend origin(s) allowed by the backend CORS / WebSocket layer (used in development; in production nginx serves everything from a single origin) |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `VITE_API_URL` | URL the frontend uses to reach the backend API. In development it points at the backend (`http://localhost:5000`); in production the build is run with it empty so the frontend uses same-origin relative URLs proxied by nginx |
| `VITE_SOCKET_URL` | Optional override for the WebSocket / quiz endpoint when it differs from `VITE_API_URL` |
| `GROQ_API_KEY` | API key for the Groq LLM used in AI report scoring/sentiment analysis |
| `AI_ENABLED` | Toggles the AI scoring feature on/off |
| `LOGSTASH_HOST` / `LOGSTASH_PORT` / `LOG_LEVEL` | Log shipping configuration for the ELK stack |
| `ELASTIC_PASSWORD` | Password for the Elasticsearch `elastic` superuser (also used to log into Kibana) |

### Run the Project

The project has two run modes, both driven by the Makefile:

- **Development** (`make dev`) — hot-reload frontend (Vite) and backend (NestJS watch), no nginx. The frontend is reached directly on port `5173` and the backend on port `5000` (cross-origin).
- **Production** (`make all` / `make prod`) — the frontend is built as static files and served by **nginx**, which also terminates TLS (HTTPS) and reverse-proxies the API, file uploads and WebSocket traffic to the backend on a single origin. Self-signed certificates are generated automatically on the first run.

```bash
# Clone the repository
git clone ...

# Development mode (hot reload, HTTP, no nginx)
make dev

# Production mode (nginx + HTTPS) — this is the default target
make all          # alias of `make prod`

# The database is seeded automatically on first run if it's empty.
# To force a manual re-seed: make seed
```

In production the certificate is self-signed, so the browser warns on the first visit — accept it to continue. To (re)generate certificates, for example embedding your LAN IP: `make certs-renew`.

### Stop the Project

```bash
make down        # Stop the development stack
make prod-down   # Stop the production (nginx) stack
make fclean      # Down + remove volumes, images and build cache
```


### Access URLs

**Development (`make dev`):**

| URL | Service |
|-----|---------|
| `http://localhost:5173` | Frontend (Vite dev server) |
| `http://localhost:5000` | Backend API |
| `http://localhost:5601` | Kibana (log monitoring) |

**Production (`make all`)**

| URL | Service |
|-----|---------|
| `https://localhost:8443` | Application (frontend + `/api` backend) |
| `http://localhost:5601` | Kibana (log monitoring) |

Kibana credentials: login `elastic`, password = value of `ELASTIC_PASSWORD` in your `.env`.

**Production (`make all` / `make prod`):**

| URL | Service |
|-----|---------|
| `https://localhost:8443` | Application — frontend, API and WebSocket served by nginx over HTTPS |
| `http://localhost:8080` | HTTP entry point (redirects to HTTPS) |
| `http://localhost:5601` | Kibana |

### Demo Accounts

If the sample dataset has been seeded, the following accounts can be used for demonstrations:

| Email | Password | Role | Main area |
|-------|----------|------|-----------|
| `lotfi@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |
| `admin@safeschool.com` | `ADMINadmin123123+` | admin | `/dashboard` |
| `prof@safeschool.com` | `PROFprof123123+` | teacher | `/reporter` |

---
## Resources

### Official Documentation

- [NestJS documentation](https://nestjs.com)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)
- [Docker documentation](https://docs.docker.com)
- [TypeORM documentation](https://typeorm.io)
- [Socket.IO documentation](https://socket.io/docs/v4/)
- [Elastic (ELK) documentation](https://www.elastic.co/guide/index.html)
- [React documentation](https://react.dev)
- [Tailwind CSS documentation](https://tailwindcss.com/docs)
- [Stephane Robert documentation](https://blog.stephane-robert.info/docs/)

### Learning Resources

- [React Beginner Course 2025 : Vite, Tailwind CSS, TypeScript](https://www.youtube.com/watch?v=siTUv1L9ymM&list=PLB_GSA94AMIyqIOyeRolfvuaxr2rA_52j&index=2)

### Domain References

- [Color contrast checker](https://www.acquia.com/fr/products/acquia-web-governance/tools/color-contrast-checker)
- [Studies on school harassment](docs/project/resources.md)

### Testing and Validation

- [Chrome DevTools](https://developer.chrome.com/docs/devtools) for runtime inspection, network debugging and UI checks
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) for quick audits on performance and general best practices
- [Cross-browser validation notes](docs/technical/browser_support.md)
<br><!- TODO équipe : completez en anglais la liste avec quelques sources pertinentes qui vont ont servi au cours du developpement -->

### AI Usage

AI tools were used during this project both **as a feature of the application** and **as a productivity tool**:

- **In the product**: report descriptions are scored and graded by severity with AI assistance to help staff triage incoming reports faster.
- **During the project lifecycle**:
  - Drafting and restructuring project documentation, always reviewed and corrected before being kept.
  - Helping weigh architecture choices and understand the trade-offs between alternatives.
  - Generating boilerplate code, always reviewed by the team and adapted to our needs.
  - Advising on how to prioritize tasks to avoid technical bottlenecks or conflicts.
  - Debugging: explaining error messages and stack traces, suggesting fixes to investigate.
  - Researching and comparing libraries before adopting one.
  - Producing a first draft of UI translations (FR/EN/DE), reviewed and corrected by the team.
  - Improving technical write-ups: PR descriptions, meeting summaries, issue reports.
  - Rewriting contribution summaries and README sections in English from rough working notes, then manually reviewing and correcting them before publication.
  - General-purpose help with linguistic questions: translation, wording, grammar and tone consistency across the FR/EN/DE interface and documentation.
  <br><!- TODO équipe : completez en anglais avec vos usages réels -->

---
## Team Information

Every team member contributed to the code as well as to the organization of the collective work.

| Member | Main role | Technical specialty |
|--------|-----------|---------------------|
| eguthman | Project Manager / Scrum Master | Frontend architecture, workflow, infrastructure |
| mdoan | Product Owner | Frontend, Design, API |
| mobougri | Technical Lead | Backend, DB, API |
| quclaque | Technical Lead | Websockets, Backend |



### 1. Product Owner — mdoan

I am the Product Owner and I actively participate in the frontend development of the application.

As Product Owner, I conducted a functional requirements analysis based on the issue of school bullying and the expectations of future users. I studied documentation and institutional resources related to the prevention and handling of bullying in schools to define the platform's essential functionalities: secure reporting, case tracking, user management, dashboards, and statistics.

I wrote and prioritized business requirements, defined user journeys, and ensured regular progress tracking of the project. My role also included verifying the conformity of the developed functionalities with the initial requirements, performing functional tests, and ensuring the overall consistency of the product.

In parallel, I participated in the application's frontend development using React, TypeScript, and Tailwind CSS. I contributed to the implementation of reusable components and the improvement of the user experience. I also worked on state management, application internationalization, dynamic forms, and the implementation of a consistent interface based on a common design system.

This dual responsibility allowed me to maintain a constant link between business needs and their technical implementation, ensuring that each developed feature delivers real value to users while respecting the project objectives.


### 2. Project Manager / Scrum Master — eguthman

Led project coordination for the full duration of the project, with responsibility for workflow structure, visibility, and documentation.

- Designed and maintained the GitHub board: views, labels, columns, module tracking and priority visibility, evolving the structure as the project grew.
- Built out the Makefile from a minimal starting point: added targets, structured startup commands, and added healthchecks in Docker Compose to make the stack reliable to bring up consistently.
- Structured the Git and pull-request workflow: wrote the conventions and maintained them throughout the project.
- Organized and facilitated team meetings throughout the project, prepared agendas in advance and wrote minutes to keep decisions and next actions traceable.
- Reviewed pull request diffs and filed issues on the board when inconsistencies or potential problems surfaced, maintaining codebase awareness even without owning the implementation.
- Built and maintained the project documentation: architecture, API, ELK stack, design system, testing guide, Git workflow.
- Took ownership of the ELK integration (Elasticsearch, Logstash, Kibana): configured the full stack with security enabled, structured backend logging, and automated dashboard import on startup.
- Contributed to frontend architecture choices: introduced Tailwind CSS and shadcn/ui to give the team a consistent visual base.

### 3. Technical Lead 1 — mobougri

Responsible for the backend architecture, database design, and full-stack data integration, as well as the complete Dockerization of the project. The real-time quiz module (WebSockets, game logic) was under quclaque's responsibility.

### 4. Technical Lead 2 — quclaque

Focused on the project's real-time layer and installability of the frontend.

- Implement the real-time multiplayer quiz end to end (NestJS gateway/service on the backend, React game interface on the frontend).
- Design the WebSocket event protocol and the synchronized game lifecycle: lobby, question flow, answer reveal, scoring and leaderboard.
- Handle the multiplayer edge cases: authentication on the socket handshake, reconnection grace period, host migration, single-room-per-account enforcement and room-capacity limits.
- Implement the Progressive Web App from scratch: service worker via vite-plugin-pwa, web app manifest, install prompt, and static shell caching for offline loading.
- Co-define the initial backend stack at project kickoff: NestJS, TypeORM, PostgreSQL, JWT authentication.
- Validate technical accuracy of documentation on features I own (WebSocket, PWA architecture HTTPS, Nginx)
- Investigate and fix bugs across the stack

---
## Project Management

### Organization

The team used a lightweight agile workflow centered on a shared GitHub project board. Work was split into issues, tagged by feature area and targeted module, then tracked through dedicated columns and filtered views to keep priorities and tasks readable at any time.

The team held recurring meetings throughout the project (most weeks, alternating solo / pair / whole-team work sessions in between — see the minutes archived in [`docs/meetings/`](docs/meetings/)). Each session reviewed progress, prioritized the backlog, clarified blockers and was used to share knowledge.

To improve coordination in a team that was discovering full-stack web development for the first time, project management also included documenting Git workflows, introducing pull-request best practices, monitoring board activity continuously, and recording decisions so the team could recover context between work sessions.

### Tools

- **GitHub Issues & Projects** — backlog, task tracking, assignment, labels, module visibility and filtered board views adapted to the project's workflow
- **GitHub Pull Requests** — code review workflow with documented expectations on review, merge readiness and collaboration hygiene
- **Git worktrees** — used during the final sprint to minimize branch-switching overhead (see [`docs/process/git-worktrees.md`](docs/process/git-worktrees.md))

### Communication

- **Slack** — day-to-day coordination, quick questions and sharing urgent information
- **GitHub** (issues / PR comments) — asynchronous, traceable technical discussions and review feedback
- **Meeting agendas and minutes** — written support for coordination, follow-up and decision traceability across the project

---
## Technical Stack


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
| TypeORM | 0.3 | ORM used to map TypeScript entities to PostgreSQL tables |
| socket.io | 4 | Real-time communication (quiz, notifications) |
| Passport / @nestjs/jwt | 11 / 4 | Authentication (JWT strategy + guards) |
| bcrypt | 6 | Secure password hashing |
| class-validator / class-transformer | — | Validation of incoming request data |
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
| nginx | Production reverse proxy, TLS termination and static frontend serving |
| Elasticsearch 8.12 | Log storage & search |
| Logstash 8.12 | Log ingestion pipeline |
| Kibana 8.12 | Log visualization |

### Technical Choices

- **React** — the subject requires a modern JavaScript frontend framework, and React gave us a widely used ecosystem with solid TypeScript support and accessible documentation.
- **NestJS** —  provides a clearer structure out of the box for a team project. It helped us organize backend code into modules, controllers and services instead of defining everything from scratch.
- **PostgreSQL** — good fit because the project relies on many related entities such as users, classes, reports, notes and parents (see [Database Schema](#database-schema)). It integrates cleanly with the rest of the stack through TypeORM.
- **TypeORM** — helped us work with the database through TypeScript entities instead of writing and maintaining all queries by hand.
- **JWT + bcrypt** — JWT was used for authentication, while bcrypt was used to securely hash passwords before storing them.
- **Docker Compose** — the project depends on several services running together. Docker Compose made local setup more consistent by giving the team a shared environment and a simple startup process. A base file is shared by both modes, with a dev overlay (hot reload, direct ports) and a prod overlay (compiled backend + nginx).
- **nginx** — in production nginx serves the built frontend, terminates TLS and reverse-proxies the API, uploads and WebSocket traffic to the backend, so the whole application runs behind a single HTTPS origin instead of exposing the dev servers directly. Same-origin serving also keeps the frontend free of hard-coded backend hosts (it uses relative URLs), so it works over localhost, a LAN IP or a domain without rebuilding.
- **ELK (Elasticsearch, Logstash, Kibana)** — ELK was chosen to centralize logs from the application and infrastructure in one place, making them easier to inspect and monitor.
- **Internationalization (i18n)** — We chose to integrate an internationalization system from the outset of the project to make the application accessible to the widest possible audience. 
The application is currently available in French, English, and German. Thanks to the i18n library, adding a new language is now very simple: each language is centralized in a dedicated translation file, which facilitates maintenance and project development. 
- **Quiz** — To raise students' awareness of bullying, we chose to develop an interactive quiz inspired by platforms such as Kahoot. The goal was to offer a more engaging educational tool than simply providing information. 

<!- TODO équipe : compléter en anglais si d'autres choix structurants méritent d'être justifiés (i18n, design system, choix du quiz comme "jeu", etc.) -->

---
## Database Schema

All tables use UUID primary keys and are managed through TypeORM entities.

### ER Diagram

```mermaid
erDiagram
  USERS ||--o| STUDENT_PROFILES : has
  USERS ||--o| STAFF_PROFILES : has
  USERS ||--o{ REPORTS : submits
  USERS ||--o{ REPORT_SUSPECTS : resolves
  USERS ||--o{ REPORT_VICTIMS : resolves
  USERS ||--o{ REPORT_NOTES : writes
  USERS ||--o{ NOTIFICATIONS : receives

  CLASSES ||--o{ STUDENT_PROFILES : contains
  CLASSES }o--o{ STAFF_PROFILES : assigned_to
  PARENTS }o--o{ STUDENT_PROFILES : linked_to

  REPORTS ||--o{ REPORT_SUSPECTS : includes
  REPORTS ||--o{ REPORT_VICTIMS : includes
  REPORTS ||--o{ REPORT_NOTES : contains
  REPORTS ||--o{ NOTIFICATIONS : triggers
```

### Tables and Relationships

```
users (role: student | teacher | staff | admin)
  ├── id (PK, uuid)
  ├── email (unique), password (hashed, select: false), firstName, lastName, avatar
  ├── 1—1 → student_profiles (if role = student)
  ├── 1—1 → staff_profiles (if role = teacher)
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
| users | role | enum (`UserRole`) | student / teacher / admin — drives permissions |
| reports | grade | enum (`ReportGrade`) | Severity grade computed from the AI scoring service |
| reports | status | enum (`ReportStatus`) | Lifecycle state of a report (default: `NEW`) |
| reports | aiScore / aiReason | float / text | Output of the AI severity scoring (`scoring.service.ts`) |
| classes | level / section | varchar | e.g. "6e" / "A" — identifies a school class |

---
## Features List

| Feature | Description | Team member(s) |
|---------|-------------|---------------|
| Authentication | Users sign in securely and are routed to role-specific areas of the application depending on their permissions. | mobougri |
| Report submission and follow-up | Students and teachers can submit harassment reports, optionally anonymously then follow the progress of their case if they are victims. | mdoan |
| Report review workflow | Admin users can assess reports, add notes, update statuses and manage case follow-up from dedicated dashboards. | mdoan |
| AI-assisted report analysis | When a report is submitted, the description is automatically analyzed to estimate severity and produce a human-readable summary shown to staff. | mobougri |
| User and role administration | Admin users can manage accounts, update roles and maintain access control across the platform. | mobougri |
| School organization management | Classes, students, parents and staff can be linked together to reflect the school's structure inside the application. | mobougri |
| Real-time multiplayer quiz | Users can join a shared harassment-awareness quiz with synchronized progression and live score updates. | quclaque |
| Notification system | The platform notifies users about report updates, quiz events and other important actions. | mobougri |
| Design system and reusable UI | The frontend relies on reusable interface components to keep the application consistent across pages and roles. | mdoan |
| Internationalization | The interface is available in French, English and German through a language switcher. | eguthman + mdoan |
| Progressive Web App | The frontend can be installed as a PWA and provides limited offline support. | quclaque |
| Search and filtering | Users can search, filter and sort reports or administrative data more efficiently. | mobougri + mdoan |
| Legal information pages | Privacy Policy and Terms of Service pages are accessible directly from the application. | eguthman |
| Activity analytics | Dashboards provide visual summaries of platform activity through charts and key indicators. | mobougri |
| Centralized logging | Application logs can be collected and inspected through the ELK stack for monitoring and troubleshooting. | eguthman |

<!- TODO équipe : assigner les logins (un ou plusieurs par ligne), ajuster les libellés/descriptions si besoin pour coller exactement au périmètre livré -->

---
## Modules

| Module | Category | Type | Points | Description / justification | Team member(s) |
|--------|----------|------|--------|------------------------------|---------------|
| Use a framework for both frontend and backend | Web | Major | 2 | Implemented with React on the frontend and NestJS on the backend, giving both sides of the project a structured framework-based architecture. | mobrougri + mdoan |
| Real-time features — WebSockets (Quiz) | Web | Major | 2 | Implemented through a Socket.io quiz module that synchronizes room state, scores and progression between connected players in real time. | quclaque |
| ORM database (TypeORM) | Web | Minor | 1 | Implemented with TypeORM entities, repositories and relations to manage persistence against the PostgreSQL database. | mobrougri |
| Advanced search functionality | Web | Minor | 1 | Implemented with filtering, sorting and search controls on report and administration views. | mobrougri + mdoan |
| Progressive Web App (PWA) | Web | Minor | 1 | Implemented with a web app manifest and service-worker-based offline support for the frontend. | quclaque |
| 10 reusable components — Custom design system | Web | Minor | 1 | Implemented through a reusable component set and shared UI rules for colors, typography and layout patterns. | mdoan |
| Notification system | Web | Minor | 1 | Implemented as in-app notifications tied to report updates, quiz-related events and other important user actions. | mobougri |
| Sentiment analysis on report descriptions | Artificial Intelligence | Minor | 1 | Implemented via a Groq LLM call on each report submission: the model classifies the description by severity (physical threat / emotional distress / verbal / banal), returns an urgency flag and a short explanation. The score contribution feeds the final severity grade; the explanation is displayed to staff in the report detail view. | mobougri |
| Support 3 languages (i18n — fr/en/de) | Accessibility & i18n | Minor | 1 | Implemented with translated interface strings and a language switcher for French, English and German. | eguthman + mdoan |
| Support 3 browsers | Accessibility & i18n | Minor | 1 | Implemented by testing and adjusting the application for Chrome, Firefox and Edge. | mobrougi + mdoan |
| Advanced permissions system (CRUD) | User Management | Major | 2 | Implemented with role-based access control and administrative CRUD actions adapted to each user type. | mobougri |
| Organization system | User Management | Major | 2 | Implemented with classes, student profiles, staff profiles and parents linked together inside the same data model and admin workflows. | mobougri |
| User activity analytics dashboard | User Management | Minor | 1 | Implemented with dashboard views and charts summarizing activity and platform data. | mobougri |
| Implement a complete web-based game (Quiz) | Gaming & UX | Major | 2 | Implemented as a complete browser-based awareness quiz with rules, scoring, question flow and shared match state. | quclaque |
| Remote players | Gaming & UX | Major | 2 | Implemented by allowing players on separate devices to join the same live quiz room and play together over the network. | quclaque |
| Multiplayer game (3+ players) | Gaming & UX | Major | 2 | Implemented with quiz rooms that support more than two simultaneous players in the same match. | quclaque |
| Infrastructure for log management (ELK) | Devops | Major | 2 | Implemented with Elasticsearch, Logstash and Kibana connected to application logging so logs can be centralized and inspected from one stack. | eguthman |

**Total: 8 Major × 2 + 9 Minor × 1 = 25 pts** (minimum required: 14 pts — the surplus beyond 14 may count as bonus, capped at +5 pts per the subject's Bonus part)

<!- TODO équipe :
  - assigner les logins par module
  - vérifier que chaque module est démontrable intégralement à l'éval
  - si certains modules listés ci-dessus ne sont finalement pas livrés, les retirer et recalculer le total
-->

---
## Individual Contributions

<!- TODO équipe (important) : le sujet est explicite — chaque membre doit pouvoir expliquer et justifier sa propre contribution à l'oral. Ne décrivez que ce que vous avez réellement fait et comprenez en profondeur. -->

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

- Chosed the topic of school bullying because it is a major societal issue that regularly makes headlines. I was surprised to find that there are still few solutions available to middle school students to easily report bullying or alert a trusted adult.
- Participated in defining functional requirements and validating features to ensure their compliance with the specifications.
- Developed a large part of the application's frontend using React.
- Designed the user interface with Tailwind CSS and custom CSS to provide a clear, modern, and accessible user experience.
- Organized the various pages and React components to make the application easy to maintain and evolve.
- Contributed to the user experience design, ensuring that the user journeys were simple and intuitive for students.
- Ensured that the data provided by the backend met the frontend's requirements to allow for the correct integration of functionalities.
- Collaborated with the backend developers to verify that the APIs exposed the information necessary for displaying data in the interface.
- Performed functional tests to verify that the developed functionalities met the specifications.
- Participated in the final validation of the application by verifying the consistency between the initial requirements and the functionalities actually implemented.

### mobougri

**Backend Lead & Full-Stack Integration**

- Designed and developed the NestJS backend from scratch: TypeORM entities, DTOs with `class-validator` validation, JWT guards, services and controllers covering all core modules — `reports`, `users`, `parents`, `classes`, `staff-profiles`, `student-profiles`, `notifications`.
- Set up the PostgreSQL database: complete schema, entity relationships with cascade delete rules, and seeding for demo data.
- Implemented the security layer: password hashing with bcrypt, JWT authentication via Passport, input validation with `class-validator` and a global `ValidationPipe`, and role-based route protection via guards.
- Built the incident reporting system on the backend side: report creation, automatic case numbering, status lifecycle, administrative notes, convocations addressed to specific users by UUID, and resolution of suspects and victims against real user accounts.
- Handled data integration between backend and frontend: designed `api.ts` as the single service layer and maintained `types/index.ts` as the shared type contract, keeping TypeScript types consistent across both sides of the stack throughout parallel branch development.
- Dockerized the full project: wrote multi-stage `Dockerfile` for both the frontend (Node.js + Vite) and the backend (NestJS), configured `docker-compose.yml` orchestrating all services with persistent volumes, internal networks, and environment variables via `.env`, and set up a PostgreSQL healthcheck with `depends_on: condition: service_healthy` to guarantee ordered startup.
- Main ambition: to keep developing SafeSchool beyond this project and see it one day deployed in schools across France — because harassment is a real problem that deserves a real tool.

### quclaque

- Designed and implemented the real-time multiplayer quiz end to end: the NestJS WebSocket gateway and game service on the backend, and the React game interface (lobby, live questions, answer reveal and final leaderboard) on the frontend.
- Built the quiz around a Socket.IO event protocol with server-authoritative game state: rooms identified by a join code, a shared question flow with per-question timers, a reveal phase showing answer statistics, and a scoring model that combines answer speed and answer streaks.
- Handled the hard multiplayer cases so several players on different devices can play the same match reliably: JWT authentication on the socket handshake, a reconnection grace period that restores a player's in-progress state, host migration when the host leaves, single-room-per-account enforcement and room-capacity limits.
- Contributed to the Progressive Web App so the frontend can be installed and offers limited offline support.
- Main challenge: this was my first time with NestJS and Socket.IO, so the hardest part was understanding the tech stack — how NestJS gateways, dependency injection and Socket.IO rooms/events fit together — and then using it to keep every client's game state synchronized in real time. I worked through it by reading the documentation, building the game flow incrementally, and testing it with several simultaneous clients.


---
## Additional Information

For deeper documentation beyond what is required here — architecture overview, API map, WebSocket quiz flow, ELK, PWA, design-system material, meeting minutes and workflow notes — start with [`docs/DOCS.md`](docs/DOCS.md).

### Known Limitations

- Firefox does not support installing the application as a PWA (no `beforeinstallprompt` / install affordance). The app still runs normally in Firefox, and the service worker and offline caching keep working — only the "install to home screen / desktop" step is unavailable, so install it from Chrome or Edge instead.
- The PWA's **offline mode depends on a trusted TLS certificate**, and this project ships a **self-signed** one (no public domain / trusted CA). Two things must be distinguished: *installing* the app only needs a "secure context" (which `localhost` is granted automatically, even with a self-signed cert), but *registering the service worker* — the part that makes the app load offline — requires the certificate to actually be **trusted**. Clicking "proceed anyway" on the browser warning lets the page render but does **not** satisfy the service worker, which keeps failing with an SSL certificate error. As a result:
  - On the **host machine** over `https://localhost:8443`, you can install the app, but the service worker only registers (and offline truly works) once you import the certificate into the browser/OS trust store.
  - **Other devices** (phones, tablets, other computers) reach the app over the LAN IP, which is not even a secure origin until the certificate is trusted — so neither install nor offline works there until that device trusts `nginx/certs/fullchain.pem` as a CA.
  - In **dev mode** (`make dev`) over `http://localhost`, there is no certificate to validate and `localhost` is a secure context, so the service worker registers and offline works out of the box.

  To get full offline support anywhere, trust the certificate on that device — see [`docs/technical/pwa.md`](docs/technical/pwa.md).

<!- TODO équipe : lister les en anglais les limites connues constatées en fin de projet (ex. fonctionnalités partielles, contraintes de temps, choix assumés).  -->

### License

This project was created as part of the 42 School curriculum (common core, "ft_transcendence") and is intended for educational and evaluation purposes as of June 2026.
