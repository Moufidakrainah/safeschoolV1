Comment vérifier ce module
C'est le module le plus simple à valider — il suffit d'ouvrir ton application dans chaque navigateur et de tester toutes les fonctionnalités.
Les navigateurs à tester :
Le sujet dit "au moins 2 navigateurs supplémentaires" en plus de Chrome. Prends les plus accessibles :
Chrome  ← déjà requis par le sujet
Firefox ← gratuit, disponible sur tous les OS
Edge    ← déjà installé sur Windows
Safari  ← uniquement sur Mac/iPhone
Ce qu'il faut tester dans chaque navigateur :
✅ Connexion / déconnexion
✅ Affichage des signalements
✅ Filtres et recherche
✅ Création d'un signalement (formulaire multi-étapes)
✅ Navigation au clavier
✅ Upload de fichiers
✅ Responsive mobile
✅ Les animations et transitions

Les différences entre navigateurs
CSS
Certaines propriétés CSS ne sont pas supportées partout ou se comportent différemment :
css/* gap dans flexbox — pas supporté sur vieux Safari */
.flex { gap: 16px; }

/* :focus-visible — support variable */
:focus-visible { outline: 2px solid blue; }

/* scrollbar styling — uniquement Chrome/Edge */
::-webkit-scrollbar { width: 8px; }
JavaScript
Fetch API        → supporté partout
CSS Grid         → supporté partout
IntersectionObserver → supporté partout
Web Animations   → différences mineures
Formulaires
input type="date"    → rendu très différent selon les navigateurs
input type="search"  → icône de croix différente
select               → style natif différent sur chaque OS
Fonts et rendu texte
Safari  → antialiasing différent, texte légèrement plus fin
Firefox → rendu pixel légèrement différent
Edge    → identique à Chrome (même moteur Chromium)

Les problèmes les plus fréquents
Firefox :
css/* scrollbar prend de la place en Firefox, pas en Chrome */
/* Solution : */
scrollbar-gutter: stable;
Safari :
css/* flexbox gap pas supporté sur vieux Safari */
/* Solution : utiliser margin à la place ou vérifier la version */

/* position: sticky buggé dans certains contextes */
/* Solution : ajouter -webkit-sticky */
position: -webkit-sticky;
position: sticky;
tsx// fetch avec credentials — Safari est plus strict sur les CORS
// Solution : vérifier que ton backend envoie les bons headers CORS
Edge :
Edge utilise le même moteur que Chrome (Chromium)
→ quasiment aucune différence
→ c'est le navigateur le plus facile à supporter

Comment documenter
Le sujet demande de documenter les limitations. Dans ton README.md :
markdown## Compatibilité navigateurs

| Fonctionnalité | Chrome | Firefox | Edge | Safari |
|---|---|---|---|---|
| Connexion | ✅ | ✅ | ✅ | ✅ |
| Signalements | ✅ | ✅ | ✅ | ✅ |
| Upload fichiers | ✅ | ✅ | ✅ | ✅ |
| input type="date" | ✅ | ✅ | ✅ | ⚠️ rendu différent |
| Notifications | ✅ | ✅ | ✅ | ❌ non supporté |

### Limitations connues
- **Safari** : le style natif des champs `date` est différent
- **Firefox** : la scrollbar prend de l'espace contrairement à Chrome

Outils pour tester sans avoir tous les navigateurs
Si tu n'as pas de Mac pour tester Safari :
BrowserStack  → service payant, essai gratuit
LambdaTest    → idem
Sauce Labs    → idem
Ou plus simplement — si quelqu'un dans ton équipe a un iPhone ou un Mac, il peut tester Safari.

En résumé
C'est le module le plus rapide à valider :

1h de tests dans Firefox et Edge
noter les différences dans le README
corriger les 2-3 petits bugs CSS qui apparaissent

La plupart du temps avec Tailwind les différences sont minimes car Tailwind inclut automatiquement des préfixes CSS pour la compatibilité navigateur.