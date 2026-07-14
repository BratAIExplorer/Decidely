# Decidely

A fresh standalone MVP for a personal decision-analysis tool that can later grow into a business SaaS product.

## Run

Open `index.html` in a browser, or serve the folder with any static server.

## BETA Scope

- One universal input box — describe any dilemma, business or personal
- AI auto-detects the context and renders the right analysis lenses (SWOT/Criteria for business; Values Compass/Regret Minimization for personal)
- Bring your own Google Gemini API key (Settings ⚙) — stored only in your browser, sent directly to Google, never to us
- Demo mode works with no key at all
- Compassion Pause: crisis-related queries are caught locally (before any network call) and met with human support resources instead of AI analysis
- Plain-language confidence notes — no fake percentages
- Save decisions locally in the browser; export as JSON

## AI Provider

Gemini first (free tier available at aistudio.google.com). The `providers` adapter in `app.js` lets OpenAI, Anthropic, or local models slot in later without a rewrite.

## Business-Ready Next Steps

- Add AI-backed analysis API
- Add user accounts and workspaces
- Add encrypted cloud storage
- Add team comments and approvals
- Add billing, audit logs, and admin controls
