# Browser Support

SafeSchool is supported on three browsers: Chrome (primary target), Firefox, and Edge.

## Tested Browsers

| Browser | Version | Platform | Result |
|---|---|---|---|
| Google Chrome | Latest stable | Desktop / Mobile | ✅ Primary target — full support |
| Mozilla Firefox | Latest stable | Desktop | ✅ Core application supported |
| Microsoft Edge | Latest stable | Desktop | ✅ Full support |

## Testing Scope

Each browser was validated against the main user flows:

- Authentication (login, session persistence, role-based redirect)
- Report submission (multi-step form, anonymous toggle, validation)
- Admin and reporter dashboards (CRUD, filtering, sorting, pagination)
- Real-time quiz (WebSocket connection, room join/leave, live scoring, leaderboard)
- Notification system (display, mark-as-read)
- Profile page and avatar upload
- Language switcher (FR / EN / DE)
- PWA install prompt (behavior varies by browser — see notes below)

## Browser-Specific Notes

### Google Chrome

No issues. Chrome is the primary development and testing environment. PWA install prompt and service worker registration behave as expected. All features function correctly.

### Mozilla Firefox

- All core features work correctly including WebSocket-based real-time quiz.
- PWA install flow: Firefox does not support the `beforeinstallprompt` event used by our in-browser install prompt, so the prompt is not shown there.
- The application still runs normally as a standard web app in Firefox. Service-worker-based offline caching remains a separate concern tied to certificate trust, as documented in [`pwa.md`](./pwa.md).
- No layout or visual regressions observed.

### Microsoft Edge

- Full support. Edge shares the Chromium engine with Chrome — behavior is consistent across both browsers.
- PWA install prompt works as in Chrome.
- No layout or visual regressions observed.

## Known Limitations

- The in-browser PWA install prompt is only available in Chrome and Edge because Firefox does not expose `beforeinstallprompt`.
- The application has not been tested on Safari and no Safari compatibility is claimed.

## UI/UX Consistency

The interface is built with Tailwind CSS v4 and shadcn/ui-pattern components (Base UI primitives). Both are well-supported across modern Chromium and Firefox-based browsers.
