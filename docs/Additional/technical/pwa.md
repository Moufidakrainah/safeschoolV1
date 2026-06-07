C'est quoi une PWA ?
PWA = Progressive Web App. C'est une application web qui se comporte comme une application mobile native. Elle s'installe sur le téléphone ou l'ordinateur et fonctionne même sans connexion internet.

Les 3 caractéristiques d'une PWA
1. Installable
L'utilisateur voit un bouton "Installer l'application" dans son navigateur. Une fois installée, elle apparaît sur l'écran d'accueil comme une vraie app :
Safari sur iPhone → "Ajouter à l'écran d'accueil"
Chrome sur Android → "Installer l'application"
Chrome sur PC → icône d'installation dans la barre d'adresse
2. Offline
Un Service Worker tourne en arrière-plan et met en cache les ressources. Si l'utilisateur perd sa connexion, l'app continue de fonctionner partiellement.
3. Notifications push
L'app peut envoyer des notifications même quand elle n'est pas ouverte — comme une vraie app mobile.

Techniquement, qu'est-ce que ça demande ?
manifest.json        ← décrit l'app (nom, icône, couleurs)
Service Worker       ← script qui tourne en arrière-plan
HTTPS                ← obligatoire pour les PWA
Avec Vite c'est simple grâce au plugin vite-plugin-pwa :

```bash
npm install -D vite-plugin-pwa
```

// vite.config.ts

```bash
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SafeSchool',
        short_name: 'SafeSchool',
        theme_color: '#0097b2',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ]
      }
    })
  ],
})
```

Est-ce que ça apporte quelque chose à ton projet ?
Oui, et même assez bien justifié pour trois raisons :
Raison 1 — Usage mobile
Les élèves et professeurs utilisent probablement leurs téléphones. Une PWA installée sur l'écran d'accueil est bien plus accessible qu'une URL à retaper.
Raison 2 — Offline partiel
Si un élève veut faire un signalement et que le réseau de l'école est instable, le formulaire pourrait rester accessible grâce au cache.
Raison 3 — Notifications push
Très pertinent pour ton projet — un admin pourrait recevoir une notification quand un nouveau signalement critique arrive, sans avoir l'onglet ouvert.