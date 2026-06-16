import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA : rend l'application installable et disponible hors ligne (cache via service worker)
    VitePWA({
      registerType: "autoUpdate", // met à jour le service worker automatiquement
      injectRegister: "auto", // enregistre le service worker sans code supplémentaire
      includeAssets: ["logos/safeschool-logo.png", "teacher.png"],
      manifest: {
        name: "Safe School",
        short_name: "Safe School",
        description:
          "Plateforme de signalement et de prévention en milieu scolaire",
        lang: "fr",
        theme_color: "#0f5a63",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/logos/safeschool-logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logos/safeschool-logo.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/logos/safeschool-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Précache les fichiers du build pour que l'app se charge hors ligne
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // En navigation hors ligne, sert index.html (SPA) sauf pour l'API et les websockets
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      // Active le service worker en mode dev (npm run dev) pour pouvoir tester hors ligne
      devOptions: {
        enabled: true,
        navigateFallback: "index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
