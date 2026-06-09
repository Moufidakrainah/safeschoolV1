# Git Worktrees — Quick Start Guide

Work on multiple branches simultaneously without `git stash` or `git switch`.
Each worktree is a **normal folder** linked to a different branch of the same repository.

- The repository has **a single `.git/`**, regardless of the number of worktrees
- A branch can only be open in **one** worktree at a time
- Each worktree has its own working directory and index (staging area)
- `node_modules`, `.env`, build artifacts → **not shared**, must be recreated in each worktree

## Main Commands

```bash
# Create a worktree on an existing branch
git worktree add ../my-project-doc DOC/main

# Create a worktree and a new branch
git worktree add -b feat/https ../my-project-https main

# List active worktrees
git worktree list

# Remove a worktree
git worktree remove ../my-project-doc

# Force removal
git worktree remove --force ../my-project-doc

# Clean up stale references
git worktree prune
```

## Typical Setup for This Project

```bash
# From the main project directory (e.g. on branch feat/https)
git worktree add ../project-doc DOC/main

# Result:
# <project-root>/          → feat/https  (code)
# <project-root>-doc/      → DOC/main    (documentation)
```

In each folder: `git add`, `git commit`, `git push` work normally.
A push from the doc worktree pushes to `DOC/main`, not to `feat/https`.

## Workflow Example

```bash
# Terminal 1 — working on code
cd <project-root>

# Terminal 2 — working on documentation
cd <project-root>-doc
git add docs/git-worktrees.md
git commit -m "docs: add git worktrees guide"
git push
```

No need to switch branches — each terminal stays on its own branch.

## Common Errors

| Problem | Cause | Fix |
|---|---|---|
| `fatal: branch already checked out` | The branch is already open elsewhere | `git worktree list` to find where |
| Missing dependencies | `node_modules` are not shared | `npm install` in the new worktree |
| Missing environment variables | `.env` is not shared | Copy or recreate `.env` |
| Stale references after `rm -rf` | Folder deleted without `worktree remove` | `git worktree prune` |

## Cleanup

```bash
# Once the branch is merged and the worktree is no longer needed
git worktree remove ../project-doc
# The folder is deleted; the local branch remains
```
