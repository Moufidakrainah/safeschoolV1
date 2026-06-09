1. Skip link — priorité absolue

2. Focus visible

3. Contraste des couleurs
Vérifie tes couleurs sur webaim.org/resources/contrastchecker. Les combinaisons à vérifier en priorité dans ton projet :

Le ratio minimum est 4.5:1 pour le texte normal.

4. Annonces dynamiques
Quand la liste des signalements se met à jour après un filtre, le lecteur d'écran doit l'annoncer :

5. Gestion du focus dans les modales
shadcn Dialog le fait automatiquement. Mais ta modale de suppression est faite à la main — il faut piéger le focus dedans :

6. Langue de la page
Dans ton index.html, déclare la langue :
html<html lang="fr">
Et si tu changes de langue dynamiquement :
tsx// Dans ton composant de changement de langue
document.documentElement.lang = newLanguage; // 'fr', 'en', 'de'

7. Titres hiérarchiques
Vérifie que tu n'as qu'un seul <h1> par page et que la hiérarchie est respectée :
h1 → titre principal de la page
  h2 → sections principales
    h3 → sous-sections
Dans ton AdminDashboard vérifie qu'il y a bien un h1 quelque part et que les h2, h3 suivent l'ordre.


8. Images et icônes
Les emojis utilisés comme icônes doivent être cachés ou décrits :

9. Formulaires — erreurs accessibles
Dans ton formulaire de signalement, les erreurs doivent être annoncées :

10. Tableaux
Dans ta vue détail tu as un tableau — il doit avoir des en-têtes :

Comment tester
Installe l'extension axe DevTools dans Chrome — c'est gratuit et ça détecte automatiquement la majorité des erreurs WCAG :
Chrome Web Store → "axe DevTools"
→ F12 → onglet "axe DevTools"
→ "Scan ALL of my page"
→ liste toutes les violations WCAG
Teste aussi avec uniquement le clavier — Tab, Shift+Tab, Enter, Espace, flèches. Si tu peux tout faire sans souris, c'est bon.