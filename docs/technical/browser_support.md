# Browser Support

SafeSchool is validated on three browsers: Chrome (primary target), Firefox, and Edge.

## Tested Browsers

| Browser | Version | Platform | Result |
|---|---|---|---|
| Google Chrome | Latest stable | Desktop / Mobile | ✅ Primary target — full support |
| Mozilla Firefox | Latest stable | Desktop | ✅ Full support |
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
- PWA: Firefox does not support the `beforeinstallprompt` event. The install prompt is not shown. The application runs normally as a standard web app; offline support via the service worker is still active.
- No layout or visual regressions observed.

### Microsoft Edge

- Full support. Edge shares the Chromium engine with Chrome — behavior is consistent across both browsers.
- PWA install prompt works as in Chrome.
- No layout or visual regressions observed.

## Known Limitations

- PWA installation is only supported in Chrome and Edge. Firefox users cannot install the application to their home screen or desktop.
- The application has not been tested on Safari and no Safari compatibility is claimed.

## UI/UX Consistency

The interface is built with Tailwind CSS v4 and shadcn/ui (Radix UI primitives). Both are well-supported across modern Chromium and Firefox-based browsers. No layout inconsistencies were identified across the three supported browsers.
