Comment ont été créés les fichiers/dossiers automatiques ?
nest new — La commande de création du projet
Au tout début du projet, quelqu'un a tapé dans son terminal :
bashnpx @nestjs/cli new backend
Cette commande a fait tout ça automatiquement en une seule fois :
backend/
├── src/
│   ├── app.module.ts        ← fichier vide de départ
│   ├── app.controller.ts    ← fichier vide de départ
│   ├── app.service.ts       ← fichier vide de départ
│   └── main.ts              ← fichier vide de départ
├── nest-cli.json            ← config du CLI
├── tsconfig.json            ← config TypeScript
├── tsconfig.build.json      ← config TypeScript pour la prod
├── eslint.config.mjs        ← config du linter
├── package.json             ← liste des dépendances
└── package-lock.json        ← versions exactes verrouillées
Le CLI a aussi automatiquement lancé npm install, ce qui a créé node_modules/.

npm install — La création de node_modules/
Quand quelqu'un clone le projet et tape npm install, npm lit package.json, télécharge toutes les librairies listées, et les place dans node_modules/. Ce dossier peut peser 300-500 Mo et n'est jamais versionné dans Git (il est dans .gitignore).

tsc — La création de dist/
Le dossier dist/ est créé quand on compile le TypeScript en JavaScript. La commande est :
bashnpm run build
# qui exécute en réalité :
tsc -p tsconfig.build.json
TypeScript ne peut pas s'exécuter directement. Node.js ne comprend que JavaScript. Donc tsc (le compilateur TypeScript) lit chaque fichier .ts de src/ et produit son équivalent .js dans dist/. C'est ce dossier dist/ que Node.js exécute réellement en production.
Les fichiers .js.map sont des source maps : ils font le lien entre le .js compilé et le .ts original, ce qui permet aux outils de debug de t'afficher le code TypeScript même quand c'est le JS qui tourne.
Les fichiers .d.ts sont des fichiers de déclaration de types : ils décrivent la "forme" des exports TypeScript pour que d'autres fichiers puissent les utiliser avec les bons types.
En développement avec Docker, le projet tourne avec nest start --watch qui recompile automatiquement à chaque modification, sans que tu aies à relancer quoi que ce soit.

main.ts — Chaque mot, chaque ligne
tsimport { NestFactory } from "@nestjs/core";

import — mot-clé JavaScript/TypeScript pour importer du code depuis un autre fichier ou une librairie
{ NestFactory } — on importe uniquement la classe NestFactory depuis la librairie (les accolades signifient qu'on fait un import nommé, pas un import de tout le module)
from "@nestjs/core" — @nestjs/core est une librairie installée dans node_modules/. Le @ indique que c'est un scoped package npm (un package organisé sous une organisation, ici nestjs)

NestFactory est la fabrique principale de NestJS. Son seul rôle est de créer l'application.

tsimport { NestExpressApplication } from "@nestjs/platform-express";
NestJS peut tourner sur plusieurs moteurs HTTP. Par défaut il utilise Express (le framework HTTP Node.js le plus populaire). NestExpressApplication est le type TypeScript qui représente une application NestJS tournant sur Express. On l'importe ici uniquement pour le typage — ça permet d'utiliser des méthodes spécifiques à Express comme useStaticAssets() un peu plus bas.

tsimport { AppModule } from "./app.module";

"./app.module" — le ./ signifie "dans le même dossier que ce fichier". On importe AppModule depuis src/app.module.ts. C'est le module racine de toute l'application.


tsimport { join } from "path";
path est un module intégré à Node.js (pas besoin de l'installer). join est une fonction qui construit des chemins de fichiers de façon cross-platform. Par exemple :
tsjoin("uploads", "avatars", "photo.jpg")
// → "uploads/avatars/photo.jpg" sur Linux/Mac
// → "uploads\avatars\photo.jpg" sur Windows
Sans join, si tu concatènes des chemins avec des / à la main, ça peut casser sur Windows.

tsasync function bootstrap() {

async — cette fonction est asynchrone. Elle peut contenir des opérations qui prennent du temps (ouvrir un serveur, se connecter à la BDD) sans bloquer le reste du programme. En JavaScript, tout ce qui touche au réseau ou aux fichiers est asynchrone.
function bootstrap() — c'est simplement le nom choisi par convention dans NestJS pour la fonction de démarrage. Tu pourrais l'appeler main() ou start(), ça fonctionnerait pareil. La communauté NestJS utilise bootstrap par tradition.


ts  const app = await NestFactory.create<NestExpressApplication>(AppModule);
C'est la ligne la plus importante de tout le fichier.

const app — on stocke l'application créée dans une variable
await — on attend que la création soit terminée avant de continuer. Sans await, on passerait à la ligne suivante avant que l'app soit prête, ce qui causerait des erreurs. await ne fonctionne que dans une fonction async.
NestFactory.create<NestExpressApplication>(...) — on appelle la méthode create de NestFactory. Le <NestExpressApplication> entre chevrons est de la syntaxe générique TypeScript : on précise le type de l'application créée pour que TypeScript sache quelles méthodes sont disponibles dessus. Sans ça, TypeScript ne saurait pas que useStaticAssets() existe.
(AppModule) — on passe AppModule en argument. NestJS va lire ce module, découvrir tous les modules qu'il importe, instancier tous les services, connecter tous les controllers... C'est le point de départ de toute la chaîne.


ts  app.enableCors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

app.enableCors(...) — active le CORS sur l'application

Pourquoi le CORS existe-t-il ?
C'est une sécurité des navigateurs. Par défaut, un navigateur refuse qu'une page web sur localhost:5173 fasse des requêtes vers localhost:3000 car ce sont deux "origines" différentes (port différent = origine différente). Cette protection existe pour éviter qu'un site malveillant puisse appeler l'API d'un autre site en ton nom.

origin: "http://localhost:5173" — on autorise uniquement les requêtes venant de cette adresse (le frontend Vite en développement). En production ce serait ton vrai domaine.
methods: ["GET", "POST", "PATCH", "DELETE"] — on autorise uniquement ces verbes HTTP. PUT n'est pas listé car le projet utilise PATCH pour les modifications partielles.
allowedHeaders: ["Content-Type", "Authorization"] — on autorise uniquement ces deux headers dans les requêtes :

Content-Type — permet d'envoyer du JSON (application/json)
Authorization — permet d'envoyer le JWT (Bearer <token>)




ts  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

app.useStaticAssets(...) — dit à Express de servir un dossier comme fichiers statiques (comme un mini serveur de fichiers)
join(__dirname, '..', 'uploads') — construit le chemin physique vers le dossier :

__dirname est une variable Node.js qui contient le chemin du dossier du fichier en cours d'exécution. En production (dans dist/), __dirname vaut /app/dist. En dev, ça dépend de la config.
'..' remonte d'un niveau dans l'arborescence (de dist/ vers la racine)
'uploads' descend dans le dossier uploads
Résultat : /app/uploads


{ prefix: '/uploads' } — les fichiers seront accessibles via l'URL /uploads/.... Donc /app/uploads/avatars/photo.jpg sur le disque devient accessible via http://localhost:5000/uploads/avatars/photo.jpg dans le navigateur.


ts  await app.listen(process.env.PORT ?? 3000);

await app.listen(...) — démarre le serveur HTTP et le met en écoute sur un port. C'est ici que le serveur "s'allume" vraiment.
process.env.PORT — process.env est un objet Node.js qui contient toutes les variables d'environnement du système. PORT est lue depuis l'environnement (définie dans .env ou dans Docker).
?? 3000 — l'opérateur nullish coalescing. Si process.env.PORT est undefined ou null, on utilise 3000 comme valeur par défaut. C'est différent de || : avec ||, la valeur 0 serait aussi remplacée par 3000, ce qui serait un bug si PORT valait 0.


ts}
bootstrap();

La fermeture } termine la définition de la fonction bootstrap
bootstrap() — on appelle la fonction. Sans cette ligne, la fonction serait définie mais jamais exécutée, et le serveur ne démarrerait jamais. C'est la ligne qui "lance" tout.


Récapitulatif visuel
bootstrap() appelée
  │
  ├── NestFactory.create(AppModule)
  │     └── NestJS lit AppModule
  │           └── instancie tous les modules, services, controllers
  │
  ├── enableCors()         → autorise le frontend à communiquer
  │
  ├── useStaticAssets()    → sert les avatars comme fichiers statiques
  │
  └── app.listen(3000)     → le serveur est en ligne ✓
Quand tu veux, on passe à app.module.ts au même niveau de détail, ou on attaque la priorité 2 !