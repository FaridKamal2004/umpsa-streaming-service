# Architecture and decisions

## Application flow

```text
index.html + styles.css
          |
       app.js (DOM/events, modal and player lifecycle)
       /    \
catalog.js   store.js
search/sort  validated local state
recommend    |
       browser localStorage

HTML video ---- HTTPS public sample-media host
```

`catalog.js` contains film metadata and pure selection/recommendation functions. `store.js` owns state normalization and immutable updates. `app.js` coordinates DOM rendering, user events, storage, and the player. No framework is needed for four films and three views; this keeps the code inspectable and deployment small. This is a deliberate enhancement rather than a claim to implement every requirement in the original report.

## State contract

Local storage key: `umpsa-stream:v2`.

```json
{
  "name": "Guest",
  "saved": ["sintel"],
  "progress": {
    "sintel": { "seconds": 42, "duration": 888 }
  }
}
```

Only known film IDs are retained. Saved IDs are deduplicated; progress must contain finite nonnegative seconds and a positive duration. Time is clamped to the duration. Invalid JSON or denied storage falls back to a guest state. Failed writes preserve in-memory interaction and display a warning. Display names are trimmed, capped at 32 UTF-16 code units, and inserted using `textContent`.

One browser origin has one profile. Different devices, browser profiles, and origins do not share data. This is persistence, not authentication or a security boundary. Multiple tabs are not synchronized live; reload to read the latest stored state.

## Player lifecycle

Opening a film sets its video source and opens a native dialog. After metadata loads, unfinished progress is restored. The native player handles controls, seeking, and fullscreen. Progress persists at five-second intervals and on pause, page hiding, page exit, and dialog closure. Closing pauses the video and removes the source to release resources. Failed loads produce a visible status message. At 95% completion a film no longer appears under Continue watching, and replay starts from the beginning.

## Recommendation rule

Curated order promotes films in genres from the watchlist or any watched title. Ties preserve catalog order. It is a local deterministic heuristic, with no machine-learning model, tracking backend, or profiling service. Explicit sort modes override curated ordering.

## Security and privacy choices

- No credential collection, fake OAuth buttons, or pretend payment forms.
- User-supplied display names never enter HTML templates. Film templates use trusted bundled metadata and escape relevant text.
- No API keys or build-time secrets. Browser data contains names, saved IDs, and viewing progress only.
- External creator links use `noopener noreferrer`.
- The development server only exposes `index.html` and `src/`, rejects traversal, and accepts GET/HEAD only. It is a local preview server, not a production backend.
- GitHub Actions has read-only repository access for testing, with Pages/OIDC permissions only in the deployment job. Pull requests never deploy.

## Production roadmap

1. Add a backend with managed authentication, server-side authorization, and isolated per-user data.
2. Introduce a licensed catalog, caption tracks, content moderation, a proper media CDN, adaptive streaming, and accessibility review.
3. Add an entitlement model and payment provider with verified webhooks; never trust a client-side premium flag.
4. Add integration tests against the real backend, cross-browser coverage, performance budgets, monitoring, rate limits, and operational recovery procedures.

These are future changes, not currently shipped functionality.
