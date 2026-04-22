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
