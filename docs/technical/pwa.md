# Progressive Web App (PWA)

SafeSchool is configured as a Progressive Web App, allowing users to install it on their device and access core content without a network connection.

## Implementation

Built using `vite-plugin-pwa` on top of the existing Vite configuration.

```ts
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Safe School",
        short_name: "Safe School",
        theme_color: "#0f5a63",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
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
        // Precache the build; serve index.html offline except for the API and WebSocket
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
      },
    }),
  ],
});
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

## Self-signed certificate: install vs. offline

This project ships a **self-signed** TLS certificate (no public domain or trusted CA). That makes two otherwise-related things behave differently, which is a common source of confusion:

- **Installing** the app only requires a _secure context_. The browser grants `localhost` a secure context automatically, even with a self-signed (untrusted) certificate — so the install prompt appears, and the page renders, on the host machine.
- **Registering the service worker** — the part that actually caches the app shell and makes it load offline — requires the certificate to be _trusted_. The service worker script (`sw.js`) is fetched over a connection that must have **no certificate error**. Clicking "Proceed anyway" on the browser warning works for normal page navigation and subresources, but the service worker fetch ignores that bypass and keeps failing with:

  ```
  An SSL certificate error occurred when fetching the script.
  Failed to register a ServiceWorker for scope ('https://localhost:8443/')
  with script ('https://localhost:8443/sw.js'): An SSL certificate error occurred when fetching the script.
  ```

  In DevTools → Application → Service Workers this shows up as a worker stuck `trying to install` (with a `1970` epoch "Received" date) that never reaches `activated and is running`.

### Behaviour per environment

| Environment                                       | Secure context?          | Certificate valid?      | Service worker registers? | Offline works? |
| ------------------------------------------------- | ------------------------ | ----------------------- | ------------------------- | -------------- |
| `make dev` over `http://localhost`                | Yes (`localhost` waiver) | n/a — no TLS            | Yes                       | Yes            |
| Prod `https://localhost:8443`, cert **untrusted** | Yes (`localhost`)        | No (click-through only) | No                        | No             |
| Prod `https://localhost:8443`, cert **trusted**   | Yes                      | Yes                     | Yes                       | Yes            |
| Other device over LAN IP, cert **untrusted**      | No                       | No                      | No                        | No             |
| Other device over LAN IP, cert **trusted**        | Yes                      | Yes                     | Yes                       | Yes            |

The takeaway: to get real offline support — on the host machine _or_ on a phone/tablet/other computer — that device must **trust the certificate** (`nginx/certs/fullchain.pem`). In `make dev` over HTTP it works out of the box because there is no certificate to validate.

### Trusting the certificate in Chrome (GUI, no terminal)

This can be done entirely in the browser interface:

1. Open Chrome → three-dots menu (top right) → **Settings**.
2. Left sidebar → **Privacy and security** → **Security**.
3. Scroll to the bottom → **Manage certificates** (on newer Chrome this opens the `chrome://certificate-manager` page).
4. Go to the **Local certificates** / **Authorities** tab.
5. Click **Import**, browse to your `.crt` / `.pem` file (e.g. `nginx/certs/fullchain.pem`), select it and click **Open**.
6. In the trust dialog, check **"Trust this certificate for identifying websites"**.
7. Click **OK** and **restart Chrome completely**.

After restarting, `https://localhost:8443` (or the LAN IP) loads without a warning, and the service worker reaches `activated and is running`. For a LAN IP to be accepted, the certificate must include that IP in its Subject Alternative Names — regenerate with `make certs-renew CERT_IP=<your-LAN-IP>` if needed.
