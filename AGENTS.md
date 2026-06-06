# AGENTS.md

## NLIDE documentation (read first)

Before changing design or code, read:

1. **[docs/meta/documentation-guide.md](docs/meta/documentation-guide.md)** — update docs when user changes design or you infer new choices
2. **[docs/meta/user-decisions.md](docs/meta/user-decisions.md)** — **[USER]** explicit decisions (do not override)
3. **[docs/meta/communication-style.md](docs/meta/communication-style.md)** — **[USER]** explain with plain reframe + progress (read before status replies)
4. **[docs/meta/ai-inferred-decisions.md](docs/meta/ai-inferred-decisions.md)** — **[AI-INFERRED]** defaults (revisable)
5. **[docs/implementation/current-state.md](docs/implementation/current-state.md)** — what is built/deployed now
6. **[docs/README.md](docs/README.md)** — full doc index

**Rule:** Any design or implementation change → update the relevant docs in the same session. Label **[USER]** vs **[AI-INFERRED]** clearly.

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **NLIDE** (API base `https://4yqeeuk9.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
