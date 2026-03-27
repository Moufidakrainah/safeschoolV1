# Team Collaboration Guidelines (Phase 1)

These guidelines define how we collaborate on documentation and code during the first project phase.
The goal is to move fast, keep visibility, and avoid heavy process too early.

## Scope

- Everyone can contribute to documentation freely
- We do not enforce strict "sensitive vs non-sensitive" document categories
- We will refine rules after observing real contribution patterns in a couple of weeks
- CODEOWNERS and strict branch governance are intentionally postponed in Phase 1

## Minimal Rules

1. Do not commit directly to `main`.
2. Work on a branch for each topic.
3. Open a pull request to merge changes into `main`.

## Branch Naming

- `docs/<topic>` for documentation updates.
- `feat/<topic>` for new features.
- `fix/<topic>` for bug fixes.
- `maintenance/<topic>` for maintenance tasks.

## Pull Request (PR)

A pull request is a merge request from your branch to `main`.

## PR Ownership (Who Reviews and Merges)

- Documentation PRs (changes under `docs/`): Documentation Lead is requested for review.
- Code PRs (non-documentation changes): reviewed by designated Code Merge Owners (tech leads).
- Mixed PRs (code + docs): request both documentation and code review before merge.

## Main Branch Usage

- Use `main` from day one as the shared integration branch.
- Do not develop directly on `main`.
- Always branch from `main`, then open a PR back to `main`.
- Keep `main` stable and deployable at all times.

## Workflow

1. Create your branch from `main`.
2. Commit your updates.
3. Push the branch.
4. Open a pull request to `main`.
5. Address comments if needed.
6. The designated Code Merge Owner (tech lead) performs the merge after required approvals.

## Practical Merge Rule for Phase 1

- If a PR touches `docs/`, request documentation review.
- If a PR touches code, request code owner review.
- If a PR touches both, request both reviews.

## After Phase 1

Review how the team contributed and decide whether stricter governance is needed.
Possible next step: introduce CODEOWNERS only for the paths that truly need it.
