# Changelog

## Unreleased

### Fixed
- **App was stuck on the Compassion Pause screen on every load, no matter what.** `styles.css` set `display: grid`/`display: block` directly on `.modal-backdrop`, `.compassion-screen`, and `.results` (the settings modal, crisis screen, and results panel). In CSS, a normal author rule always beats the browser's built-in `[hidden] { display: none }` rule regardless of selector specificity, so these three elements rendered even while their `hidden` attribute was set — the crisis overlay sat on top of the real homepage from the first paint, and the results panel (with its Save/Export buttons) was present in the DOM before any analysis ran.
  - Fix: added a single `[hidden] { display: none !important; }` rule so the `hidden` attribute is authoritative for every element in the app, present and future.
  - Verified: homepage loads correctly; demo analysis renders only after "Untangle this"; Save/Export only appear after analysis; crisis phrases ("I want to end my life") correctly show the Compassion Pause and "← Go back" returns to the app; Settings modal opens/closes correctly.
