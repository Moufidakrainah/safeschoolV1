# Team Collaboration Guidelines (Phase 1)

These guidelines define how we collaborate on documentation and code during the first project phase.
The goal is to move fast, keep visibility, and avoid heavy process too early.

## Scope

- Everyone can contribute to documentation freely
- We do not enforce strict "sensitive vs non-sensitive" document categories
- We will refine rules after observing real contribution patterns in a couple of weeks
- CODEOWNERS and strict branch governance are intentionally postponed

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

## PR Ownership (Who Reviews and Who Merges)

- Documentation PRs (changes under `docs/`): Documentation Lead reviews.
- Code PRs (non-documentation changes): Code Merge Owners (tech leads) review.
- Mixed PRs (code + docs): both documentation and code reviews are required.

## Review and Merge Matrix

- PR touches `docs/` only:
	- Reviewer: Documentation Lead
	- Merger: Documentation Lead
- PR touches code only:
	- Reviewer: Code Merge Owner (tech lead)
	- Merger: Code Merge Owner (tech lead)
- PR touches both code and `docs/`:
	- Reviewers: Documentation Lead + Code Merge Owner
	- Merger: Code Merge Owner (after both approvals)

## Main Branch Usage

- Use `main` from day one as the shared integration branch.
- Do not develop directly on `main`.
- Always branch from `main`, then open a PR back to `main`.
- Keep `main` stable and deployable at all times.

## Contributor Workflow (Step by Step)

1. Create your branch from `main`.
2. Commit your updates.
3. Push the branch.
4. Open a PR to `main` with a clear title (example: `docs: update team roles`).
5. Add the right reviewer(s):
	 - `docs/` changes -> Documentation Lead
	 - code changes -> Code Merge Owner
	 - mixed changes -> both
6. Address review comments on the same branch.
7. Merge is done by the role defined in the matrix above.

## GitHub UI Quick Steps

1. Click `New branch` from `main`.
2. Commit and push changes.
3. Click `Compare & pull request`.
4. Confirm `base: main` and `compare: your-branch`.
5. Add reviewer(s) in the `Reviewers` panel.
6. Merge when approved.

## Practical Merge Rule for Phase 1

- Keep PRs small and focused.
- One topic per PR when possible.
- If unsure who should review, tag both Documentation Lead and a Code Merge Owner.

## After Phase 1

Review how the team contributed and decide whether stricter governance is needed.
Possible next step: introduce CODEOWNERS only for the paths that truly need it.
