*This project has been created as part of the 42 curriculum by eguthman, mdoan, mobougri, quclaque.*

---
## Description

**SafeSchool** is a full-stack web platform designed to help middle schools handle harassment reports more safely and more consistently.
Students can report situations they witness or experience, while teachers can report situations they witness. Each report is graded by severity with AI assistance, then routed to the school's administrative staff for follow-up.

### Key Features

- Report submission and triage, with AI-assisted severity scoring and sentiment analysis of report descriptions
- Customized dashboards for students, teachers, and administrators with different access levels depending on their roles
- Administrators have access to reports, users, and classes (CRUD)
- Teachers have access to their profile, report creation, and quizzes
- Organization system: schools structured into classes, with students, parents and staff linked to them
- Real-time multiplayer quiz on school-harassment awareness, powered by WebSockets
- Game features include live score updates, leaderboard, and remote play across devices
- Notification system for report status changes and other key events
- Multilingual interface (French / English / German) tested across Chrome, Firefox and Edge
- Installable Progressive Web App (PWA) whose static shell is cached for offline loading (backend data still requires a connection)
- Centralized log management and monitoring via the ELK stack (Elasticsearch, Logstash, Kibana)

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

**Production (`make all` / `make prod`):**

| URL | Service |
|-----|---------|
| `https://localhost:8443` | Application — frontend, API and WebSocket served by nginx over HTTPS |
| `http://localhost:8080` | HTTP entry point (redirects to HTTPS) |
| `http://localhost:5601` | Kibana |

Kibana credentials: login `elastic`, password = value of `ELASTIC_PASSWORD` in your `.env`.

### Demo Accounts

If the sample dataset has been seeded, the following accounts can be used for demonstrations:

| Email | Password | Role | Main area |
|-------|----------|------|-----------|
| `admin@safeschool.com` | `ADMINadmin123123+` | admin | `/dashboard` |
| `prof@safeschool.com` | `PROFprof123123+` | teacher | `/reporter` |
| `prof2@safeschool.com` | `PROFprof123123+` | teacher | `/reporter` |
| `lotfi@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |
| `danya@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |
| `lina@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |
| `lucas@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |
| `emma@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |
| `kevin@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |
| `sara@safeschool.com` | `ELEVEeleve123123+` | student | `/student` |

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
- [Three-browser validation notes](docs/technical/browser_support.md)

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

---
## Team Information

This section summarizes each member's assigned role and core responsibilities. More detailed implementation work is listed later in Individual Contributions.

| Member | Assigned role(s) | Responsibilities |
|--------|------------------|------------------|
| eguthman | Project Manager / DevOps & Documentation Lead | Coordinated the workflow and led the project's technical documentation, ELK integration, Docker/Makefile reliability work, and delivery-readiness. |
| mdoan | Product Owner, Frontend Developer | Defined and prioritized business requirements, validated delivered features, and contributed to the frontend, design system, forms, and user journeys. |
| mobougri | Technical Lead, Backend Developer | Led backend architecture, database design, authentication, API design, data integration, and Dockerization of the application stack. |
| quclaque | Technical Lead, Realtime Developer | Led the multiplayer quiz, WebSocket protocol, synchronization logic, reconnection handling, and Progressive Web App implementation. |

---
## Project Management

### Organization

The team used a lightweight agile workflow centered on a shared GitHub project board. Work was split into issues, tagged by feature area and targeted module, then tracked through dedicated columns and filtered views to keep priorities and tasks readable at any time.

The team held recurring meetings throughout the project (most weeks, alternating solo / pair / whole-team work sessions in between — see the minutes archived in [`docs/meetings/`](docs/meetings/)). Each session reviewed progress, prioritized the backlog, clarified blockers and was used to share knowledge.

To improve coordination in a team that was discovering full-stack web development for the first time, project management also included documenting Git workflows, introducing pull-request best practices, monitoring board activity continuously, and recording decisions so the team could recover context between work sessions.

### Tools

- **GitHub Issues & Projects** — backlog, task tracking, assignment, labels, module visibility and filtered board views adapted to the project's workflow
- **GitHub Pull Requests** — code review workflow with documented expectations on review, merge readiness and collaboration hygiene

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
- **NestJS** — provides a clearer structure out of the box for a team project. It helped us organize backend code into modules, controllers and services instead of defining everything from scratch.
- **PostgreSQL** — good fit because the project relies on many related entities such as users, classes, reports, notes and parents (see [Database Schema](#database-schema)). It integrates cleanly with the rest of the stack through TypeORM.
- **TypeORM** — helped us work with the database through TypeScript entities instead of writing and maintaining all queries by hand.
- **JWT + bcrypt** — JWT was used for authentication, while bcrypt was used to securely hash passwords before storing them.
- **Docker Compose** — the project depends on several services running together. Docker Compose made local setup more consistent by giving the team a shared environment and a simple startup process. A base file is shared by both modes, with a dev overlay (hot reload, direct ports) and a prod overlay (compiled backend + nginx).
- **nginx** — in production nginx serves the built frontend, terminates TLS and reverse-proxies the API, uploads and WebSocket traffic to the backend, so the whole application runs behind a single HTTPS origin instead of exposing the dev servers directly. Same-origin serving also keeps the frontend free of hard-coded backend hosts (it uses relative URLs), so it works over localhost, a LAN IP or a domain without rebuilding.
- **ELK (Elasticsearch, Logstash, Kibana)** — ELK was chosen to centralize logs from the application and infrastructure in one place, making them easier to inspect and monitor.
- **Internationalization (i18n)** — We chose to integrate an internationalization system from the outset of the project to make the application accessible to the widest possible audience. 
The application is currently available in French, English, and German. Thanks to the i18n library, adding a new language is now very simple: each language is centralized in a dedicated translation file, which facilitates maintenance and project development. 
- **Quiz** — To raise students' awareness of bullying, we chose to develop an interactive quiz inspired by platforms such as Kahoot. The goal was to offer a more engaging educational tool than simply providing information. 

---
## Database Schema

All tables use UUID primary keys and are managed through TypeORM entities.

### ER Diagram

![Database Schema](docs/safeschool_erd.svg)

### Tables and Relationships

```
users (role: student | teacher | director | admin)
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
  ├── id (PK), freeText
  ├── N—1 → reports          (cascade delete)
  └── N—1 → users            (resolvedUserId, nullable, set null on delete)

report_notes
  ├── id (PK), content, type (enum: note | convocation | status_change)
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
| users | role | enum (`UserRole`) | student / teacher / director / admin — drives permissions |
| reports | grade | enum (`ReportGrade`) | Severity grade computed from the AI scoring service |
| reports | status | enum (`ReportStatus`) | Lifecycle state of a report (default: `NEW`) |
| reports | aiScore / aiReason | float / text | Output of the AI severity scoring (`scoring.service.ts`) |
| classes | level / section | varchar | e.g. "6eme" / "A" — identifies a school class |


Note that the role director is defined in the code with the same permissions as admin, but reserved for future use — no seeded account and not offered in the user-creation form, so the demo ships with student, teacher and admin only.

## Features List

This section lists the delivered product features from a user and platform perspective. The next section, Modules, maps those outcomes to the official subject modules and explains how each was justified and implemented.

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

---
## Modules

Each entry below maps one chosen subject module to its concrete implementation in the project. The justification is intentionally module-specific so evaluators can see why it was selected and how it is demonstrable in the delivered product.

| Module | Category | Type | Points | Description / justification | Team member(s) |
|--------|----------|------|--------|------------------------------|---------------|
| Use a framework for both frontend and backend | Web | Major | 2 | Chosen to structure a large team project on both sides of the stack. React organizes the client into reusable routed views and components, while NestJS organizes the backend into modules, controllers, services and guards; both choices are directly visible in the delivered codebase. | mobougri + mdoan |
| Real-time features — WebSockets (Quiz) | Web | Major | 2 | Chosen because the quiz depends on synchronized live gameplay between several connected users. Implemented with Socket.IO rooms, server-authoritative game state, live score updates, answer reveals and reconnection handling, all demonstrable during a multiplayer session. | quclaque |
| ORM database (TypeORM) | Web | Minor | 1 | Chosen because the platform relies on many related entities and role-based data flows. Implemented with TypeORM entities, repositories and relations mapped to PostgreSQL, which makes the schema and persistence layer directly demonstrable from the code and database model. | mobougri |
| Advanced search functionality | Web | Minor | 1 | Chosen to keep report and administration views usable as the dataset grows. Implemented with filtering, sorting and search controls on the relevant dashboards so users can narrow down records efficiently during real usage. | mobougri + mdoan |
| Progressive Web App (PWA) | Web | Minor | 1 | Chosen to make the frontend installable and more resilient on school devices. Implemented with a web app manifest, service worker registration and static shell caching, which can be demonstrated directly from the browser and installation flow. | quclaque |
| 10 reusable components — Custom design system | Web | Minor | 1 | Reusable component set built on Base UI primitives with Tailwind and class-variance-authority — centralized color palette (oklch) and typography tokens, `lucide-react` icons, and 16 components in `components/ui/`, with a `/ui-kit` styleguide page. | mdoan |
| Notification system | Web | Minor | 1 | Chosen so users receive visible feedback when important events occur in the application. Implemented as in-app notifications tied to report updates and other key user actions, making the feature demonstrable from normal product flows without relying on external tooling. | mobougri |
| Sentiment analysis on report descriptions | Artificial Intelligence | Minor | 1 | Implemented via a Groq LLM call on each report submission: the model classifies the description by severity (physical threat / emotional distress / verbal / banal), returns an urgency flag and a short explanation. The score contribution feeds the final severity grade; the explanation is displayed to staff in the report detail view. | mobougri |
| Support 3 languages (i18n — fr/en/de) | Accessibility & i18n | Minor | 1 | Chosen to make the platform usable by a broader school audience. Implemented with dedicated translation files and a language switcher for French, English and German, so the multilingual behavior can be demonstrated immediately in the interface. | eguthman + mdoan |
| Support 3 browsers | Accessibility & i18n | Minor | 1 | Chosen because the application is meant to be used on heterogeneous school and home devices. Implemented by testing and adjusting the main application flows for Chrome, Firefox and Edge, while documenting the browser-specific difference that Firefox does not expose the PWA install prompt used in Chrome and Edge. | mobougri + mdoan |
| Advanced permissions system (CRUD) | User Management | Major | 2 | Implemented with role-based access control and administrative CRUD actions adapted to each user type. | mobougri |
| Organization system | User Management | Major | 2 | Implemented with classes, student profiles, staff profiles and parents linked together inside the same data model and admin workflows. | mobougri |
| User activity analytics dashboard | User Management | Minor | 1 | Implemented with dashboard views and charts summarizing activity and platform data. | mobougri |
| Implement a complete web-based game (Quiz) | Gaming & UX | Major | 2 | Chosen to turn harassment awareness into an interactive activity rather than a static information page. Implemented as a full browser-based quiz with lobby, question flow, timing, scoring, reveal phases and final leaderboard, which makes the game loop fully demonstrable. | quclaque |
| Remote players | Gaming & UX | Major | 2 | Chosen so the quiz can be played by users on separate devices instead of a single local machine. Implemented through networked quiz rooms joined by code, with synchronized state shared across connected clients over WebSockets. | quclaque |
| Multiplayer game (3+ players) | Gaming & UX | Major | 2 | Chosen to satisfy a true multiplayer experience rather than a duel-only mode. Implemented with quiz rooms supporting multiple simultaneous players, live ranking updates and host-managed progression, and can be demonstrated with more than two connected users. | quclaque |
| Infrastructure for log management (ELK) | Devops | Major | 2 | Implemented with Elasticsearch, Logstash and Kibana connected to application logging so logs can be centralized and inspected from one stack. | eguthman |

**Total: 8 Major × 2 + 9 Minor × 1 = 25 pts** (minimum required: 14 pts — the surplus beyond 14 may count as bonus, capped at +5 pts per the subject's Bonus part)

---
## Individual Contributions

### eguthman

Project Manager / DevOps & Documentation Lead

- Led the project's DevOps and technical documentation work: built out the Makefile, hardened the Docker Compose setup with healthchecks and ordered startup, documented the architecture and workflows, and prepared the project for reliable delivery and evaluation.
- Built and integrated the ELK stack: set up the full Elasticsearch/Logstash/Kibana stack with security enabled, structured backend logging into business events, log retention and an auto-imported Kibana dashboard, and handled first-boot provisioning so ELK never blocks the application.
- Contributed to the frontend's technical base: configured Tailwind CSS v4, set up the first base components and the initial ui-kit styleguide page, giving the frontend team a shared starting point for reusable UI work.
- Wrote the validation playbook and a QA approach using ELK as a live anomaly detector during multi-user test sessions.
- Acted as Project Manager throughout the project: researched project-management practices for a small 42 team, designed and maintained the GitHub board (views, labels, columns, module and priority tracking).
- Organized recurring meetings, prepared agendas and wrote minutes to keep decisions, blockers and next actions traceable.
- Reviewed pull-request diffs, triaged and tracked issues on the board and followed up on fixes through to closure — keeping awareness of the codebase even on parts I did not implement.
- Drove the code-quality effort: tuned the backend ESLint configuration, ran linting across the stack and documented the findings, then assigned the fixes to the relevant owners and tracked them.
- Established and documented the Git and pull-request workflow (branch/commit conventions, review practices).
- Built and reorganized the project documentation as a coherent set (architecture, API, ELK, security, testing/validation playbook, Git workflow), turning unfamiliar web concepts into shared guidance.
- My contribution centered on coordination, documentation, DevOps and reliability rather than end-user features; I made the work traceable, reusable and directly supportive of the team's delivery.

### mdoan

Product Owner / Frontend Developer

- Chose the topic of school bullying because it is a major societal issue that regularly makes headlines. I was surprised to find that there are still few solutions available to middle school students to easily report bullying or alert a trusted adult.
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

Technical Lead / Backend Lead & Full-Stack Integration

- Designed and developed the NestJS backend from scratch: TypeORM entities, DTOs with `class-validator` validation, JWT guards, services and controllers covering all core modules — `reports`, `users`, `parents`, `classes`, `staff-profiles`, `student-profiles`, `notifications`.
- Set up the PostgreSQL database: complete schema, entity relationships with cascade delete rules, and seeding for demo data.
- Implemented the security layer: password hashing with bcrypt, JWT authentication via Passport, input validation with `class-validator` and a global `ValidationPipe`, and role-based route protection via guards.
- Built the incident reporting system on the backend side: report creation, automatic case numbering, status lifecycle, administrative notes, convocations addressed to specific users by UUID, and resolution of suspects and victims against real user accounts.
- Handled data integration between backend and frontend: designed `api.ts` as the single service layer and maintained `types/index.ts` as the shared type contract, keeping TypeScript types consistent across both sides of the stack throughout parallel branch development.
- Dockerized the full project: wrote multi-stage `Dockerfile` for both the frontend (Node.js + Vite) and the backend (NestJS), configured `docker-compose.yml` orchestrating all services with persistent volumes, internal networks, and environment variables via `.env`, and set up a PostgreSQL healthcheck with `depends_on: condition: service_healthy` to guarantee ordered startup.
- Main ambition: to keep developing SafeSchool beyond this project and see it one day deployed in schools across France — because harassment is a real problem that deserves a real tool.

### quclaque

Technical Lead / Realtime Developer

- Designed and implemented the real-time multiplayer quiz end to end: the NestJS WebSocket gateway and game service on the backend, and the React game interface (lobby, live questions, answer reveal and final leaderboard) on the frontend.
- Built the quiz around a Socket.IO event protocol with server-authoritative game state: rooms identified by a join code, a shared question flow with per-question timers, a reveal phase showing answer statistics, and a scoring model that combines answer speed and answer streaks.
- Handled the hard multiplayer cases so several players on different devices can play the same match reliably: JWT authentication on the socket handshake, a reconnection grace period that restores a player's in-progress state, host migration when the host leaves, single-room-per-account enforcement and room-capacity limits.
- Contributed to the Progressive Web App so the frontend can be installed and offers limited offline support.
- Main challenge: this was my first time with NestJS and Socket.IO, so the hardest part was understanding the tech stack — how NestJS gateways, dependency injection and Socket.IO rooms/events fit together — and then using it to keep every client's game state synchronized in real time. I worked through it by reading the documentation, building the game flow incrementally, and testing it with several simultaneous clients.

---
## Additional Information

For deeper documentation beyond what is required here — architecture overview, API map, WebSocket quiz flow, ELK, PWA, design-system material, meeting minutes and workflow notes — start with [`docs/DOCS.md`](docs/DOCS.md).

### Known Limitations

- Firefox is supported for normal use of the application, but it does not expose the `beforeinstallprompt` event used by our in-browser PWA install flow. As a result, the app runs normally in Firefox, but the install prompt is only available in Chrome and Edge.
- The PWA's **offline mode depends on a trusted TLS certificate**, and this project ships a **self-signed** one (no public domain / trusted CA). Two things must be distinguished: *installing* the app only needs a "secure context" (which `localhost` is granted automatically, even with a self-signed cert), but *registering the service worker* — the part that makes the app load offline — requires the certificate to actually be **trusted**. Clicking "proceed anyway" on the browser warning lets the page render but does **not** satisfy the service worker, which keeps failing with an SSL certificate error. As a result:
  - On the **host machine** over `https://localhost:8443`, you can install the app, but the service worker only registers (and offline truly works) once you import the certificate into the browser/OS trust store.
  - **Other devices** (phones, tablets, other computers) reach the app over the LAN IP, which is not even a secure origin until the certificate is trusted — so neither install nor offline works there until that device trusts `nginx/certs/fullchain.pem` as a CA.
  - In **dev mode** (`make dev`) over `http://localhost`, there is no certificate to validate and `localhost` is a secure context, so the service worker registers and offline works out of the box.

  To get full offline support anywhere, trust the certificate on that device — see [`docs/technical/pwa.md`](docs/technical/pwa.md).

### License

This project was created as part of the 42 School curriculum (common core, "ft_transcendence") and is intended for educational and evaluation purposes as of June 2026.