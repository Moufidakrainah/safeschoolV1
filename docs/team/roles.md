# Team & Roles

### 1. Product Owner — mdoan

Defines what the product needs to do and why. Works closely with the team to ensure the right features are built first, prevents scope creep, and adapts priorities based on progress and challenges.

- Define product vision and goals.
- Translate project requirements into prioritized tasks.
- Document decisions and feature evolution.
- Manage scope and maintain realistic expectations.
---

### 2. Project Manager / Scrum Master — eguthman

Keeps the project on track. Manages the timeline, organizes regular syncs, removes obstacles, and ensures everyone is aligned on priorities. Acts as the central point for resolving conflicts and ensuring no part of the project is left behind.

- Coordinate team tasks and workflow.
- Organize and facilitate meetings.
- Track progress and identify blockers.
- Ensure clear communication across the team.
- Document processes and decisions.

---

### 3. Technical Leadership — quclaque & mobougri

**Shared Model (not silos)**

- **quclaque**: Frontend expertise — architecture decisions, framework choices, UI/UX patterns, state management
- **mobougri**: Backend expertise — API design, database schema, real-time layer (WebSocket), deployment

Both are responsible for:
- Establishing coding standards and best practices.
- Code reviews of critical changes (not gatekeeping, but quality assurance).
- Making arbitration calls when implementation approaches conflict.
- Ensuring consistency across the codebase.

**Important:** This is **expertise-based guidance**, not exclusive ownership. Any team member can code backend or frontend based on sprint needs. The tech leads provide direction and ensure quality, not bottleneck the work.


---

## Team Members

| Member | Core Role | Technical Specialty | Status |
|--------|-----------|-------------------|--------|
| eguthman | Project Manager | Code (any area) | Confirmed |
| mdoan | Product Owner | Code (any area) | Confirmed |
| quclaque | Tech Lead | Frontend expertise | To be confirmed |
| mobougri | Tech Lead | Backend expertise | To be confirmed |

---

## Coding & Development

**All team members code everywhere.** 

The core roles (PM, PO) and tech specialties (Frontend, Backend) define **primary focus and decision authority**, not code silos.

Example workflow:
- mdoan (PO) codes a backend endpoint if needed for a sprint.
- eguthman (PM) implements a frontend component for a feature blockers.
- quclaque implements backend logic while mobougri reviews it for consistency.
- mobougri implements frontend if it aligns with architectural decisions quclaque established.

The tech leads (quclaque & mobougri) ensure code quality through reviews and guide architectural decisions, but they do not own entire layers.

---

## Additional Focus Areas (to clarify as project progresses)

As the project evolves and modules are chosen, some team members may naturally take additional focus areas beyond their core roles. These are **not new silos**, just enhanced responsibilities:

- **DevOps & Infrastructure** (likely mobougri): Docker setup, environment config, CI/CD, system stability.
- **Testing & Quality** (TBD): Oversee QA strategy, edge case scenarios (especially real-time behavior, security).
- **Design & UX Consistency** (TBD): Coordinate visual design, accessibility, i18n implementation.

These will emerge naturally as the team chooses modules and understands workload distribution. The key: **no single person is blocked by another's core role**.

---

## Notes

- Roles and responsibilities may be revisited after 1-2 weeks of work as the team's dynamics and technical choices become clearer.
- This is the first iteration; flexibility and adjustment are expected as the project scales.
