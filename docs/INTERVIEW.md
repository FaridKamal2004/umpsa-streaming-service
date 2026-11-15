# Interview walkthrough

## A truthful opening

“This started as a group university systems-analysis project with HTML UI mockups. I extended the concept into a working browser demo with film discovery, saved lists, playback progress, automated tests, and a GitHub Pages delivery pipeline. It is a frontend prototype, and I can explain where a real backend would be required.”

Review every file and practice explaining it before presenting. Be transparent about AI assistance if asked, and describe only the work you understand and can maintain.

## Suggested demonstration

| Time | Action | Discussion |
| --- | --- | --- |
| 0:00–0:30 | Open Discover; resize the viewport | Responsive layout, semantic HTML, consistent visual design |
| 0:30–1:00 | Search a director, combine genre, change sorting | Pure selection functions and non-mutating sorting |
| 1:00–1:30 | Save a title; reload; open My list | Immutable updates, persistence, validation at the storage boundary |
| 1:30–2:00 | Play a film, pause, return to Continue watching | Media events, progress, completion threshold, external dependencies |
| 2:00–2:30 | Change display name and show data-clear confirmation | Safe text rendering and privacy boundaries |
| 2:30–3:00 | Open tests and workflow | Failure paths, desktop/mobile coverage, deploy only after checks pass |

## Questions to practice

**Why vanilla JavaScript?** The supplied project was static HTML and the demo scope is small. ES modules separate UI, data selection, and persistence without adding runtime dependencies. A larger catalog and team may justify a framework later.

**Is the profile secure login?** No. It is explicitly labeled browser-local personalization. Real authentication needs a trusted server or identity provider and server-enforced authorization.

**What if localStorage is unavailable or corrupted?** Reads are parsed and normalized defensively. Invalid state falls back to a guest. Failed writes keep in-memory functionality and show that changes last only for the visit.

**How do recommendations work?** A transparent genre preference rule promotes genres of saved or watched titles. It is not machine learning.

**How does resume work?** Media time updates are persisted periodically and on lifecycle events. Once metadata is available, the app seeks to unfinished progress. Completion is defined as 95% or more.

**What would change for real users?** Server-side per-user storage, managed authentication, access control, content rights, captions, a reliable media CDN, adaptive streaming, observability, and additional cross-browser testing.

**Which tests matter most?** Combining filters, preserving lists after reload, rejecting invalid persisted state, safely displaying text that resembles HTML, confirming data reset, and recovering from video-load failures.

**What did you deliberately omit?** Fake authentication, fake premium payments, real copyrighted commercial films, and unimplemented production claims.

## Preparation checklist

- Run the project and tests yourself on your laptop.
- Understand the call path from a save-button click to storage and re-rendering.
- Explain one bug fixed through testing and one remaining limitation.
- Check the live demo on the interview network beforehand; media requires external access.
- Have the screenshots available if the interview network blocks the video host.
- Credit the original group coursework and be clear about AI-assisted enhancements.
