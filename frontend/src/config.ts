// Adresse de base de l'API backend.
//
// Dev  : `VITE_API_URL` n'est pas défini -> on tape directement le serveur
//        NestJS sur http://localhost:5000 (cross-origin, CORS activé).
// Prod : le build est lancé avec VITE_API_URL="" (voir nginx/Dockerfile),
//        ce qui donne des URLs *relatives* servies sur la même origine et
//        proxifiées vers le backend par nginx. Plus de localhost en dur,
//        donc l'app fonctionne quel que soit l'hôte (LAN, domaine, etc.).
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
