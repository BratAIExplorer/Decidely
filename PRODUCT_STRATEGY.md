# Decidely Product Strategy

## Current Decision

Decidely starts as a personal decision-making beta with local browser storage. The first goal is to prove the workflow before adding accounts, cloud sync, or paid business features.

## Principles

- Think before coding: clarify uncertain product choices before adding architecture.
- Simplicity first: keep the beta dependency-free until the workflow proves value.
- Surgical changes: keep Decidely isolated from existing Atlas projects.
- Goal-driven execution: verify each change with a concrete check before moving on.

## AI Direction

**BETA decision (2026-07-14, founder-approved):** users bring their own Gemini API key, stored only in their browser's localStorage, with direct browser-to-Google calls. There is no Decidely server, so there is nothing for us to leak — the key and the decisions never touch our infrastructure. The UI states this plainly next to the key input.

Gemini is the first provider (free tier = lowest friction). The code uses a small provider adapter object so OpenAI, Anthropic, Groq, or local models can be added without a rewrite.

**SaaS phase (post-BETA):** when Decidely becomes hosted and we manage keys, all AI calls move behind a backend endpoint with input validation and the prompt-injection defenses already logged in BACKLOG.md. Browser-side keys are a BETA-only pattern.

The demo mode (no key) continues to work when AI is unavailable.

## Positioning vs. Rationale (rationale.jina.ai)

Rationale inspired this product; we differentiate, not clone:

- They make users pick the technique; Decidely auto-detects context and picks the lenses.
- They are rational-only; Decidely is first-class on emotional/personal decisions (Values Compass, Regret Minimization) plus the Compassion Pause guardrail.
- They require accounts and their credits; Decidely is private, local, BYO key.
- They are generic-global; Decidely can own the big NRI/expat life-decision niche first.

## Success Criteria

- The app runs by opening `index.html`.
- Existing Atlas projects are not modified.
- Decisions can be analyzed without an API key.
- Decisions can be saved locally and loaded again.
- Current analysis can be exported as JSON.

## Scalable Feature Order

1. Personal local beta
2. OpenAI-backed structured analysis
3. Decision history search
4. Templates and decision playbooks
5. Cloud sync and accounts
6. Team workspaces and comments
7. Billing, admin controls, and audit logs
