🎯 1) D’où vient ce fichier ?

Le fichier tsconfig.app.json :

    est généré automatiquement par Vite si tu as créé ton projet avec un template TypeScript  
    (ex : npm create vite@latest my-app -- --template react-ts)

    ou il peut être créé manuellement dans certains projets plus avancés

    il est souvent référencé par tsconfig.json comme une configuration “enfant”

Dans un projet Vite standard, tu as souvent :
Code

tsconfig.json
tsconfig.app.json
tsconfig.node.json

👉 C’est Vite qui a créé cette structure.

🟦 2) Est-ce qu’il est obligatoire ?

Oui et non.
✔ Obligatoire si :

    ton tsconfig.json l’inclut via "extends"

    ton projet utilise plusieurs configs TS (app + node + tests)

    tu veux séparer la config du code client et du code serveur

❌ Pas obligatoire si :

    tu fusionnes tout dans un seul tsconfig.json

    tu n’as pas de code Node, pas de tests, pas de build complexe

👉 Ton application peut fonctionner sans tsconfig.app.json, mais pas sans un tsconfig.json.

🟩 3) Est-ce que l’application fonctionne si on ne l’a pas ?

Oui, si tu modifies ton tsconfig.json pour inclure les mêmes options.

Mais si tu supprimes tsconfig.app.json sans adapter tsconfig.json, alors :

    les alias @/* ne marcheront plus

    Vite ne saura plus comment résoudre les modules

    TypeScript ne saura plus où chercher les fichiers

    tu auras des erreurs d’imports

Donc :

👉 L’application peut fonctionner sans ce fichier, mais seulement si tu fusionnes sa config ailleurs.

🟧 4) Qui utilise ce fichier ?
✔ TypeScript

C’est lui qui lit ce fichier pour savoir :

    comment analyser ton code

    quels types charger

    comment résoudre les imports

    comment interpréter JSX

    quelles règles strictes appliquer

✔ Vite

Vite lit indirectement ce fichier pour :

    comprendre les alias (@/…)

    savoir comment résoudre les modules

    activer les types Vite (vite/client)

✔ Ton IDE (VS Code)

Il l’utilise pour :

    l’autocomplétion

    les erreurs TypeScript

    les imports automatiques

    la navigation dans le code

❌ Le navigateur

Il ne le lit jamais.

🟦 Pourquoi Vite sépare les fichiers TS ?

Parce que :

    tsconfig.app.json → pour le code client (React)

    tsconfig.node.json → pour les scripts Node (vite.config.ts)

    tsconfig.json → configuration racine

Cela évite les conflits entre :

    les types DOM (React)

    les types Node (vite.config)

    les types Vite

---

🟩 1) tsBuildInfoFile
json

"tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"

Fichier interne utilisé par TypeScript pour accélérer les builds.
Tu n’as jamais besoin de le toucher.
🟦 2) target
json

"target": "ES2023"

Version JavaScript que TypeScript génère.
➡️ Ici : code moderne (ES2023).
🟩 3) useDefineForClassFields
json

"useDefineForClassFields": true

Utilise la nouvelle sémantique JS pour les champs de classes.
➡️ Recommandé pour React + TS.
🟦 4) lib
json

"lib": ["ES2023", "DOM", "DOM.Iterable"]

Liste des API disponibles dans ton environnement :

    ES2023 → toutes les fonctions JS modernes

    DOM → document, window, etc.

    DOM.Iterable → NodeList.forEach, etc.

🟩 5) module
json

"module": "ESNext"

TypeScript génère des modules ES modernes.
➡️ Obligatoire pour Vite.
🟦 6) types
json

"types": ["vite/client"]

Charge les types spécifiques à Vite (ex: import.meta.env).
🟩 7) skipLibCheck
json

"skipLibCheck": true

Ignore les erreurs dans les fichiers .d.ts des libs.
➡️ Accélère la compilation.
🟦 8) moduleResolution
json

"moduleResolution": "bundler"

Mode spécial pour Vite / bundlers modernes.
➡️ Permet les imports comme @/components/....
🟩 9) allowImportingTsExtensions
json

"allowImportingTsExtensions": true

Autorise les imports du style :
ts

import x from "./file.ts";

🟦 10) verbatimModuleSyntax
json

"verbatimModuleSyntax": true

TypeScript ne modifie pas tes imports/exports.
➡️ Laisse Vite gérer.
🟩 11) moduleDetection
json

"moduleDetection": "force"

Force TypeScript à considérer tous les fichiers comme modules.
➡️ Évite des erreurs d’import/export.
🟦 12) noEmit
json

"noEmit": true

TypeScript ne génère pas de fichiers .js.
➡️ C’est Vite qui build.
🟩 13) jsx
json

"jsx": "react-jsx"

Active la nouvelle transformation JSX de React 17+.
➡️ Pas besoin d’importer React.
🟦 14) strict
json

"strict": true

Active toutes les règles strictes TypeScript.
➡️ Plus sûr, mais plus exigeant.
🟩 15) noUnusedLocals
json

"noUnusedLocals": true

Erreur si une variable locale n’est pas utilisée.
🟦 16) noUnusedParameters
json

"noUnusedParameters": true

Erreur si un paramètre de fonction n’est pas utilisé.
🟩 17) erasableSyntaxOnly
json

"erasableSyntaxOnly": true

TypeScript n’autorise que la syntaxe qui peut être effacée sans changer le JS.
➡️ Empêche des features TS non supportées par Vite.
🟦 18) noFallthroughCasesInSwitch
json

"noFallthroughCasesInSwitch": true

Empêche :
ts

case 1:
  doSomething();
case 2:
  doSomethingElse();

🟩 19) noUncheckedSideEffectImports
json

"noUncheckedSideEffectImports": true

Empêche les imports qui ne servent qu’à exécuter du code :
ts

import "./setup";

🟦 20) ignoreDeprecations
json

"ignoreDeprecations": "5.0"

Ignore les warnings de dépréciation TS < 5.0.
🟩 21) baseUrl
json

"baseUrl": "."

Base pour les chemins absolus.
➡️ Nécessaire pour paths.
🟦 22) paths
json

"paths": {
  "@/*": ["./src/*"]
}

C’est l’alias magique qui te permet d’écrire :
ts

import Button from '@/components/ui/button';

au lieu de :
ts

import Button from '../../../components/ui/button';

🟩 23) include
json

"include": ["src"]

TypeScript ne compile que le dossier src.
