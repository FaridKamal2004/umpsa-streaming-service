# Test report

Validation date: **16 November 2026** (Asia/Kuala_Lumpur).

## Automated checks

| Check | Result | Coverage |
| --- | --- | --- |
| Node unit suite | 13 passed | Catalog validity, search, combined filters, sorting, recommendations, immutable watchlists, storage recovery, progress validation, completion threshold, persistence round-trip |
| Chromium desktop | 10 passed | Discovery, persisted watchlist, safe display names, reset confirmation, details, media failure, history, storage failure, keyboard focus, accessibility, layout |
| Chromium mobile (Pixel 7 emulation) | 10 passed | The same scenarios at a mobile viewport |
| axe-core | No detected violations | WCAG 2/2.1 A and AA rules on the discovery page and open profile dialog, desktop and mobile; included in browser tests |
| Static build | Passed | `dist/index.html` and browser modules generated |
| Live media smoke check | 4 films passed | Actual decoding, seeking, persistence, and resume after reload for Sintel (888s), Big Buck Bunny (596s), Tears of Steel (734s), and Elephants Dream (654s) |
| JavaScript syntax | Passed | Application module parsed with Node |
| npm dependency audit at installation | 0 vulnerabilities reported | Development dependencies only; not a security certification |

Browser tests are deterministic and block media in the network-error scenario. They do not rely on the external film host being available. Pixel 7 is Chromium emulation, not a physical-device certification. Firefox and Safari are not covered by this suite.

## Reproduce

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts a built-site server automatically. A preview server already on port 4173 can be reused outside CI, so rebuild before testing. In CI, tests start their own server and deploy only after success. Failed browser runs retain traces in `test-results/`.

Optional checks against live external media and screenshot capture (with `npm start` running in another terminal):

```sh
node scripts/media-smoke.mjs
node scripts/capture.mjs
```

`media-smoke.mjs` checks decoding, seeking, closing, saved progress, reload, and resumed playback for each film. It is intentionally separate from deterministic CI because it depends on a third-party service. `DEMO_URL` can point these scripts at the deployed site.

## Bugs found and corrected

- The sort control originally inherited its option text as part of its accessible name. Its explicit label is now separate from the select element.
- Keyboard tabbing could leave a modal's controls. Dialog focus now loops within visible controls, and Escape returns focus to the trigger.
- A successful profile update could hide a storage-failure warning. Notifications now retain the persistence warning.
- Poster and hero artwork shared a CSS class that clipped one card. The hero class now has a distinct name, verified in desktop/mobile screenshots.
- The initial public sample-video bucket returned HTTP 403, and a W3C mirror disallowed cross-origin embedding. Both were replaced with playable Internet Archive mirrors after live-media checks.

## Visual review and boundaries

Desktop and mobile screenshots were reviewed for clipping, overflow, readability, and modal behavior. See [desktop screenshot](desktop.png) and [mobile screenshot](mobile.png).

Automated accessibility testing catches only a subset of accessibility problems. Screen-reader usability, captions, full WCAG compliance, slow-network behavior, large-catalog performance, and production security need additional work. No backend, real authentication, billing, or DRM exists to test in this demo.
