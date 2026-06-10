# Git Workflow

Team process and Git conventions. For a conceptual introduction to Git (commit vs push, branches, reset/revert, etc.), rely on the team onboarding material or your own Git reference.

---

## 1. Conventions

### Branch naming

Always create a branch from `main`, with a prefix that reflects the type of work:

- `feat/` — new feature (e.g. `feat/student-dashboard`)
- `fix/` — bug fix (e.g. `fix/login-error`)
- `docs/` — documentation (e.g. `docs/update-readme`)
- `refactor/` — rewrite with no behavior change

### Commit message format

Format: `<type>: <lowercase description>`

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` rewrite with no behavior change
- `test:` add or modify tests
- `wip:` work in progress, not yet finished

Examples: `feat: add student dashboard layout`, `docs: update meeting minutes`

---

## 2. Process

1. **Sync from `main`**:
    ```bash
    git checkout main
    git pull origin main
    ```

2. **Create a working branch**:
    ```bash
    git checkout -b feat/my-feature-name
    ```

3. **Work and commit regularly** (one commit = one logical step):
    ```bash
    git add <file>
    git commit -m "feat: description of the change"
    ```

4. **Push the branch** when the work is ready to share:
    ```bash
    git push -u origin feat/my-feature-name
    ```

5. **Open a Pull Request** on GitHub targeting `main`:
    - Clear title, description of the changes.
    - Assign a team member for review.

6. **After merge**: delete the branch on GitHub (use the "Delete branch" button) and locally:
    ```bash
    git checkout main
    git branch -d feat/my-feature-name
    ```

---

## 3. Managing conflicts

**Prevention**: sync your branch with `main` regularly to catch conflicts early, before opening the PR.
```bash
# From your feature branch
git pull origin main
```

**If a conflict appears**: resolve it in your editor, then commit and push — the PR updates automatically.

---

## 4. Absolute rules

- **No `--rebase`**: never use `git pull --rebase`, `git rebase`, or any variant. The team uses a merge-based workflow to keep a history that everyone can follow.
- **One branch = one topic**: do not stack unrelated changes on the same branch.
