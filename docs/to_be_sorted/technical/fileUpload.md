Minor: File upload and management system.
◦ Support multiple file types (images, documents, etc.).
◦ Client-side and server-side validation (type, size, format).
◦ Secure file storage with proper access control.
◦ File preview functionality where applicable.
◦ Progress indicators for uploads.
◦ Ability to delete uploaded files.




Oui, plusieurs librairies existent. Voici les meilleures pour ta stack :

Côté frontend
react-dropzone — la plus populaire et la plus simple :

npm install react-dropzone

Elle gère automatiquement :

drag & drop
validation type et taille côté client
preview des images


Côté backend NestJS
Multer — déjà intégré dans NestJS, pas besoin d'installer quoi que ce soit :


Elle gère automatiquement :

drag & drop
validation type et taille côté client
preview des images


Côté backend NestJS
Multer — déjà intégré dans NestJS, pas besoin d'installer quoi que ce soit :

Pour la barre de progression
axios que tu utilises déjà supporte nativement la progression :


Pour le stockage sécurisé
Deux options :
Option 1 — Stockage local dans Docker (simple)




Les fichiers sont dans un dossier protégé, accessibles uniquement via ton backend authentifié.
Option 2 — AWS S3 ou Cloudflare R2 (plus robuste)


Les fichiers sont stockés dans le cloud avec des URLs signées temporaires pour l'accès.

Pour la preview

Le combo recommandé pour ton projet
react-dropzone    ← drag & drop + validation client
Multer (NestJS)   ← upload + validation serveur
axios             ← barre de progression
stockage local    ← simple, suffisant pour le projet
C'est rapide à mettre en place