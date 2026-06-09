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

## Features

- **Installable**: users can add SafeSchool to their home screen or desktop from Chrome or Edge. An install prompt is displayed automatically when the browser criteria are met.
- **Offline support**: the service worker caches the application shell and static assets. If connectivity is lost, the interface remains accessible for cached content.
- **Automatic updates**: with `registerType: 'autoUpdate'`, the service worker updates silently in the background when a new version is deployed.

## Why it fits this project

SafeSchool is used in a school environment where students and staff may rely on mobile devices or unstable networks. Installing the app on the home screen lowers the barrier to reporting, and partial offline support ensures the interface remains accessible during network disruptions. The notification system also benefits from PWA infrastructure when push notifications are added in a future iteration.

## Notes

- PWA installation requires HTTPS in production — consistent with the application's infrastructure, which routes all external traffic through nginx with TLS.
- Firefox does not support the `beforeinstallprompt` event; the install prompt is not shown in Firefox, though the service worker and offline caching remain functional.
