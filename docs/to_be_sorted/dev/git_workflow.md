# Git Workflow

Process et conventions Git de l'équipe. Pour comprendre les concepts (commit vs push, branches, reset/revert, etc.), voir [git_howto.md](git_howto.md).

---

## 1. Conventions

### Nommage des branches

Toujours créer une branche depuis `main`, avec un préfixe qui reflète le type de travail :

- `feat/` — nouvelle fonctionnalité (ex: `feat/student-dashboard`)
- `fix/` — correction de bug (ex: `fix/login-error`)
- `docs/` — documentation (ex: `docs/update-readme`)
- `refactor/` — réécriture sans changement de comportement

### Format des messages de commit

Format : `<type>: <description en minuscules>`

- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation
- `refactor:` réécriture sans changement de comportement
- `test:` ajout ou modification de tests
- `wip:` travail en cours, pas encore terminé

Exemples : `feat: add student dashboard layout`, `docs: update meeting minutes`

---

## 2. Process 

1. **Se mettre à jour** depuis `main` :
    ```bash
    git checkout main
    git pull origin main
    ```

2. **Créer sa branche** de travail :
    ```bash
    git checkout -b feat/nom-de-ma-feature
    ```

3. **Travailler et commiter** régulièrement (un commit = une étape logique) :
    ```bash
    git add <fichier>
    git commit -m "feat: description du changement"
    ```

4. **Pousser la branche** quand le travail est prêt à être partagé :
    ```bash
    git push -u origin feat/nom-de-ma-feature
    ```

5. **Ouvrir une Pull Request** sur GitHub vers `main` :
    - Titre clair, description des changements.
    - Assigner un membre de l'équipe pour la review.

6. **Après le merge** : supprimer la branche sur GitHub (bouton "Delete branch") et en local  ?
    ```bash
    git checkout main
    git branch -d feat/nom-de-ma-feature
    ```

---

## 3. Gérer les conflits

**Prévention :** Synchroniser régulièrement sa branche avec `main` pour détecter les conflits tôt, avant la PR.
```bash
# Depuis votre branche de fonctionnalité
git pull origin main
```

**Si un conflit apparaît :** Résolvez-le dans votre éditeur, puis commitez et poussez : la PR se mettra à jour automatiquement.
