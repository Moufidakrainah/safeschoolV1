# Git Worktrees — Quick Start Guide

Travailler sur plusieurs branches en même temps sans `git stash` ni `git switch`.
Chaque worktree est un **dossier normal** lié à une branche différente du même repo.


- Le repo a **un seul `.git/`**, peu importe le nombre de worktrees
- Une branche ne peut être ouverte que dans **un** worktree à la fois
- Chaque worktree a son propre working directory et index (staging)
- `node_modules`, `.env`, build artifacts → **non partagés**, à recréer dans chaque worktree


## Commandes principales

```bash
# Créer un worktree sur une branche existante
git worktree add ../mon-projet-doc DOC/main

# Créer un worktree et une nouvelle branche
git worktree add -b feat/https ../mon-projet-https main

# Lister les worktrees actifs
git worktree list

# Supprimer un worktree
git worktree remove ../mon-projet-doc

# Forcer la suppression
git worktree remove --force ../mon-projet-doc

# Nettoyer les références mortes 
git worktree prune
```

## Setup typique pour ce projet

```bash
# Depuis ~/Documents/Transcendence (branche feat/https)
git worktree add ../Transcendence-doc DOC/main

# Résultat :
# ~/Documents/Transcendence       → feat/https  (code)
# ~/Documents/Transcendence-doc   → DOC/main    (doc)
```

Dans chaque dossier : `git add`, `git commit`, `git push` fonctionnent normalement.
Un push dans `Transcendence-doc` pousse sur `DOC/main`, pas sur `feat/https`.

## Exemple d'environnement

```bash
# Terminal 1 — travail sur le code
cd ~/Documents/Transcendence

# Terminal 2 — travail sur la documentation
cd ~/Documents/Transcendence-doc
git add docs/git-worktrees.md
git commit -m "docs: add git worktrees guide"
git push
```

Pas besoin de changer de branche, chaque terminal reste sur sa branche.


## Erreurs courantes

| Problème | Cause | Fix |
|---|---|---|
| `fatal: branch already checked out` | La branche est déjà ouverte ailleurs | `git worktree list` pour trouver où |
| Dépendances manquantes | `node_modules` non partagés | `npm install` dans le nouveau worktree |
| Variables d'env absentes | `.env` non partagé | Copier ou re-créer le `.env` |
| Références mortes après `rm -rf` | Dossier supprimé sans `worktree remove` | `git worktree prune` |

## Nettoyage

```bash
# Une fois la branche mergée et le worktree inutile
git worktree remove ../Transcendence-doc
# Le dossier est supprimé, la branche locale reste 
```
