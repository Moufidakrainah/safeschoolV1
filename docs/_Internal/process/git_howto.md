# Comprendre Git : Concepts Clés

Ce document explique les concepts fondamentaux de Git pour aider toute l'équipe à mieux maîtriser l'outil au quotidien. Pour le workflow de l'équipe (branches, commits, PRs), voir [git_workflow.md](git_workflow.md).

---

## 1. `commit` vs `push` : Sauvegarder pour soi, partager avec l'équipe

Ces deux actions sont souvent confondues, mais elles sont très différentes.

-   **`git commit`** : C'est une **sauvegarde locale**, uniquement sur votre machine. Comme un point de sauvegarde dans un jeu vidéo. Vous pouvez en faire autant que vous voulez, même sans internet, même si le code n'est pas encore "fini". C'est un filet de sécurité personnel.
    ```bash
    git add mon_fichier.tsx
    git commit -m "wip: amorce la structure du composant"
    ```

-   **`git push`** : C'est l'action de **partager vos commits avec l'équipe** en les envoyant sur le serveur distant (GitHub). C'est seulement à ce moment-là que vos collègues peuvent voir votre travail. C'est l'étape nécessaire avant de créer une Pull Request.
    ```bash
    git push origin feat/ma-branche
    ```

**À retenir :** Commitez souvent (dès qu'une petite étape logique est franchie), et poussez quand vous êtes prêt à partager.

---

## 2. Branches : une étiquette, pas une copie

Une idée reçue courante est de croire qu'une branche contient "uniquement les fichiers modifiés". En réalité, **une branche est un pointeur (une étiquette) vers un instantané complet du projet**.

Quand vous créez une branche depuis `main`, vous avez une copie intégrale du projet à cet instant. Quand vous faites des commits, vous enregistrez de nouveaux instantanés.

**Et supprimer une branche ne supprime pas les commits.**

---

## 3. Comment Git gère les merges (et les conflits)

Quand Git fusionne deux branches, il fait une **comparaison à trois voies** :
1.  L'ancêtre commun (le commit à partir duquel les deux branches ont divergé).
2.  L'état de votre branche.
3.  L'état de `main`.

Git regarde les différences ("diffs") et applique automatiquement les modifications qui ne se "chevauchent" pas. Un **conflit** ne survient que lorsque Git détecte que les deux branches ont modifié **les mêmes lignes du même fichier** de manière différente. C'est pour ça qu'il y en a souvent moins qu'on ne le craint.

**Pour les résoudre visuellement dans VS Code :** Quand GitHub signale un conflit sur une PR, revenez sur VS Code et faites `git pull origin main` depuis votre branche. VS Code détecte automatiquement les conflits et surligne les lignes concernées. Pour chaque conflit, vous avez le choix :
- `Accept Current Change` — garder **votre** version (celle de votre branche).
- `Accept Incoming Change` — garder la version qui vient de `main`.
- `Accept Both Changes` — garder les deux à la suite.
- Ou éditer manuellement pour faire un mix des deux.

Une fois tous les conflits résolus, sauvegardez, faites un `git commit` puis un `git push`. La PR se met à jour automatiquement.

---

## 4. Revenir en arrière : `reset` vs `revert`

| | `git reset` | `git revert` |
|---|---|---|
| **Ce que ça fait** | Efface des commits de l'historique | Crée un nouveau commit qui annule les changements |
| **L'historique** | Modifié (réécrit le passé) | Préservé (transparent) |
| **Quand l'utiliser** | Uniquement pour corriger des commits **locaux** qui n'ont jamais été `push` | Pour annuler des modifications **déjà partagées** avec l'équipe |
| **Risque** | Élevé si utilisé sur du code partagé | Faible, c'est la méthode sûre |

**Exemple avec `reset` (local uniquement) :**
```bash
git log --oneline          # Identifier le bon commit
git reset <id_du_commit>   # Revenir à cet état
```

**Exemple avec `revert` (pour du code partagé) :**
```bash
git log --oneline              # Identifier le commit fautif
git revert <id_du_commit>      # Crée un commit qui annule le fautif
```

> **Règle simple :** Si vous avez déjà fait un `push`, utilisez toujours `revert`.

---

## 5. Aide-mémoire : les commandes essentielles

### Se repérer

```bash
git status                  # État des fichiers modifiés / non commités
git branch -vv              # Liste des branches locales + lien avec le distant + retard/avance
git branch -r               # Liste des branches sur le serveur distant
git log --oneline           # Historique des commits (compact)
```

### Travailler avec les branches

```bash
git switch main                        # Aller sur une branche existante
git switch -c feat/ma-branche          # Créer une nouvelle branche et se placer dessus
git branch -m ancien-nom nouveau-nom   # Renommer une branche locale
git branch -d feat/ma-branche          # Supprimer une branche locale (déjà mergée)
```

### Se synchroniser avec le serveur

```bash
git fetch origin                        # Mettre à jour la connaissance des branches distantes (sans modifier le code)
git pull origin main                    # Récupérer les derniers commits de main dans la branche actuelle
git push -u origin feat/ma-branche      # Pousser une branche pour la première fois (-u crée le lien)
git push                                # Pousser les commits suivants (une fois le lien établi)
git push origin --delete feat/ma-branche  # Supprimer une branche sur le serveur distant
```

### Sauvegarder et commiter

```bash
git add <fichier>           # Préparer un fichier pour le commit
git add .                   # Préparer tous les fichiers modifiés
git commit -m "type: msg"   # Créer un commit
git commit --amend --no-edit  # Modifier le dernier commit (ajouter des fichiers oubliés, sans changer le message)
```

### Mettre du travail de côté sans commiter

```bash
git stash                   # Mettre les modifications non commitées de côté
git stash pop               # Récupérer les modifications mises de côté
git stash drop              # Supprimer le stash sans le récupérer
```

> `git stash` est utile quand vous réalisez que vous travaillez sur la mauvaise branche : stash → switch → stash pop.

### Vérifier les branches déjà mergées

```bash
git branch -r --merged main   # Lister les branches distantes déjà fusionnées dans main (candidates à la suppression)
```

---

## 6. Nettoyage des branches

### Vérifier qu'une branche est fully merged avant de la supprimer

```bash
# Lister toutes les branches distantes déjà mergées dans main
git branch -r --merged origin/main

# Vérifier une branche spécifique
git log origin/main..origin/<branch-name> --oneline
# Si aucune sortie → fully merged, safe à supprimer
```

### Supprimer une branche du repo distant

```bash
git push origin --delete <branch-name>
```

### Nettoyer les branches locales désynchronisées

`git branch -vv` affiche le lien entre une branche locale et son remote. Deux cas possibles :

- **`: gone]`** → le remote existait mais a été supprimé (ex : PR mergée)
- **pas de mention de remote** → la branche n'a jamais été pushée, elle est purement locale

#### Cas 1 — Remote supprimé (`: gone]`)

```bash
# Lister
git branch -vv | grep ': gone]' | awk '{print $1}'

# Supprimer (soft — échoue si non mergée)
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -d

# Supprimer (force — ignore le statut merge)
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D
```

> `-d` est safe : git refuse de supprimer une branche non mergée.
> `-D` force sans vérification.

#### Cas 2 — Branche locale orpheline (jamais pushée)

```bash
# Vérifier si elle contient des commits non présents dans main
git log main..<branch-name> --oneline
# Si aucune sortie → rien à perdre, suppression safe

git branch -d <branch-name>   # soft
git branch -D <branch-name>   # force
```

#### Script interactif (cas 1)

```bash
#!/usr/bin/env bash

set -e

echo "Fetching and pruning remotes..."
git fetch --all --prune

echo
echo "Branches whose remote is gone:"
git branch -vv | grep ': gone]' || true
echo

read -p "Delete these local branches? [y/N] " confirm

if [[ "$confirm" =~ ^[Yy]$ ]]; then
    git branch -vv \
        | grep ': gone]' \
        | awk '{print $1}' \
        | xargs -r git branch -d
fi
```

### Workflow recommandé

```bash
git fetch --all --prune          # sync + supprime les tracking refs obsolètes
git branch -vv                   # voir l'état de toutes les branches locales
git branch -r --merged origin/main  # voir lesquelles sont mergées côté distant
```
