# Progressive Web App (PWA)

SafeSchool is configured as a Progressive Web App, allowing users to install it on their device and access core content without a network connection.

## Implementation

Built using `vite-plugin-pwa` on top of the existing Vite configuration.

```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Safe School',
        short_name: 'Safe School',
        theme_color: '#0f5a63',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logos/safeschool-logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/logos/safeschool-logo.png', sizes: '512x512', type: 'image/png' },
          { src: '/logos/safeschool-logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the build; serve index.html offline except for the API and WebSocket
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
      },
    }),
  ],
})
```

## Features

- **Installable**: users can add SafeSchool to their home screen or desktop from Chrome or Edge, which surface their native install option once the PWA criteria (manifest, service worker, HTTPS) are met.
- **Offline support**: the service worker precaches the static build (the app shell — JS, CSS, HTML, icons and fonts) so an already-installed app can still boot without a network. It does **not** cache any API or WebSocket request, so screens that depend on backend data have no content offline. Offline support is therefore limited to loading the installed shell, not to using the application's data.
- **Automatic updates**: with `registerType: 'autoUpdate'`, the service worker updates silently in the background when a new version is deployed.

## Why it fits this project

SafeSchool is used in a school environment where students and staff may rely on mobile devices or unstable networks. Installing the app on the home screen lowers the barrier to reporting, and partial offline support ensures the interface remains accessible during network disruptions. The notification system also benefits from PWA infrastructure when push notifications are added in a future iteration.

## Notes

- PWA installation requires HTTPS in production — consistent with the application's infrastructure, which routes all external traffic through nginx with TLS.
- Firefox does not support the `beforeinstallprompt` event; the install prompt is not shown in Firefox, though the service worker and offline caching remain functional.
