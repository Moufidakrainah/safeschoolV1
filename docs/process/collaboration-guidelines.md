# Team Collaboration Guidelines

This document describes how the team organized its work across code, documentation, and project management. For Git mechanics (commands, commit format, conflict resolution), see [`git_workflow.md`](./git_workflow.md). For working on multiple branches in parallel, see

---

## Roles

| Role                        | Member   | Focus                                                                              |
| --------------------------- | -------- | ---------------------------------------------------------------------------------- |
| PM / Scrum Master           | eguthman | Workflow coordination, board maintenance, meeting facilitation, documentation lead |
| Product Owner               | mdoan    | Feature scope, frontend, design                                                    |
| Technical Lead — Backend    | mobougri | Backend architecture, database, API                                                |
| Technical Lead — WebSockets | quclaque | Real-time quiz, WebSocket gateway                                                  |

One functional role applies to PR ownership: **Documentation Lead** — approves and merges all PRs targeting `DOC/main` (eguthman). For code PRs targeting `main`, the author merges their own work once they have the required approvals — see Pull Requests below.

---

## Branches

The repository uses three integration branches:

| Branch          | Purpose                                                                              | Owned by           |
| --------------- | ------------------------------------------------------------------------------------ | ------------------ |
| `main`          | All application code                                                                 | All (see PR rules) |
| `frontend/main` | Frontend integration branch — used as a shared base during peak frontend development | PM                 |
| `DOC/main`      | All project documentation (`docs/`)                                                  | Documentation Lead |

Working branches are short-lived by design — one topic, merged and deleted. They follow the naming conventions in [`git_workflow.md`](./git_workflow.md):

| Prefix             | Use                               | Target     |
| ------------------ | --------------------------------- | ---------- |
| `feat/<topic>`     | New feature                       | `main`     |
| `fix/<topic>`      | Bug fix or corrective improvement | `main`     |
| `refactor/<topic>` | Rewrite with no behavior change   | `main`     |
| `docs/<topic>`     | Documentation only                | `DOC/main` |

---

## Pull Requests

### Branch protection

GitHub branch protection is active on both `main` and `DOC/main`: at least one reviewer approval is required before any PR can be merged. No exceptions.

### Ownership

The author **self-assigns** the PR — they know their changes best. They then choose their reviewers and, once the required approvals are in, **merge their own PR**.

| PR targets | Reviewers                   | Who merges            |
| ---------- | --------------------------- | --------------------- |
| `main`     | Author's choice (see below) | Author, once approved |
| `DOC/main` | Documentation Lead          | Documentation Lead    |

For PRs targeting `main`, the author decides how many reviewers to add based on the nature and scope of the change. A small isolated fix can go with one reviewer and a quick turnaround. A change touching shared infrastructure, auth, or multiple modules warrants more eyes and more time. The minimum enforced by branch protection is one approval — the author's judgment determines whether that is enough.

If a PR touches both code and documentation, the Documentation Lead is added as a reviewer for the doc parts; the author still merges once all required approvals are in.

### PR size and frequency

PRs are kept small and focused. One topic per PR, merged as soon as it is ready. The rationale:

- Reviewers don't have to process large volumes of code across dozens of files at once.
- Frequent review builds shared understanding of the whole codebase progressively.
- Working branches never diverge far from `main`, which limits merge conflicts.
- Writing a PR description forces a recap of what was done — a useful forcing function for clarity.
- Each merged PR corresponds to one identifiable unit of work, which improves traceability.

A PR can come from a short-lived branch (created, merged, deleted immediately) or represent an incremental slice from a longer-lived branch. Both patterns are valid as long as each PR has a clear, bounded scope.

### Review process

Reviews are done using GitHub's inline review feature: comments are left on specific lines, and changes can be requested before approval. Authors address feedback on the same branch — the PR updates automatically. Approval must be explicit before merge.

---

## Contributor Workflow

1. Sync from the target integration branch (`main` or `DOC/main`) before starting.
2. Create a branch with the appropriate prefix.
3. Commit regularly — one logical step per commit, using the conventional format.
4. Keep your branch up to date — pull from the target branch regularly during development
   to catch conflicts early, before they accumulate.
5. Push and open a PR targeting the right branch.
6. Self-assign the PR. Add reviewer(s) — at least one, more depending on scope and risk.
7. Address review feedback inline, on the same branch.
8. Merge your own PR once approved; delete the branch.

Full Git command reference: [`git_workflow.md`](./git_workflow.md).

---

## GitHub Project Board

The GitHub Projects board (repository → Projects tab, distinct from the raw Issues list) was the central tracking tool throughout the project.

Structure:

- **Issues** for each task or bug, linked to branches and PRs
- **Labels** by area (frontend, backend, ELK, quiz, docs) and module type (major / minor)
- **Columns** tracking status: Backlog → In Progress → In Review → Done
- **Two views**: _ISSUES ONLY_ (all non-module work) and _MODULES ONLY_ (subject module delivery tracking), kept separate to avoid noise
- **Deadline and priority fields** to surface near-term work and blockers at a glance

Ticket conventions:

- Short, descriptive title — readable at a glance in the board overview
- Fields filled in: title, assignees, status, labels, deadline
- Bug found → create a ticket; bug fixed → leave a short comment on the ticket
- Doubt or blocker → note it on the board rather than leaving it in Slack

Each session started with a board review to align priorities and identify blockers. Issues were closed when the corresponding PR was merged.

---

## Meetings

Recurring meetings were held from late March to June 2026. Minutes are archived in [`docs/meetings/`](../meetings/).

Each session:

- Agenda prepared and shared before the meeting
- Progress review since the last session
- Blocker identification and next-priority alignment
- Decisions and action items recorded in the minutes for cross-session traceability

Sessions involved the full team or a subset depending on the topic. Knowledge-sharing was used throughout to reduce information silos on shared parts of the stack.

---

## Communication

| Channel                         | Use                                                                      |
| ------------------------------- | ------------------------------------------------------------------------ |
| **Slack**                       | Day-to-day coordination, quick questions, technical tips, urgent updates |
| **GitHub Issues / PR comments** | Traceable technical discussions, inline review feedback, bug notes       |
| **Meeting minutes**             | Decision records and cross-session continuity                            |

Substantive decisions — architecture choices, scope changes, breaking API changes — were recorded in GitHub or meeting minutes rather than left in Slack threads.
