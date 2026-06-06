# Decisions

### D-001: Hybrid spec storage

- **Date:** 2026-06-06
- **Decision:** Postgres at runtime; export `/spec/*.md` on commit
- **Context:** Canvas and API need live state; external agents read markdown export
- **Status:** locked

### D-002: Flow B first

- **Date:** 2026-06-06
- **Decision:** Build human input → intent MD before Flow A repo import or Flow C execution
- **Context:** NLIDE product is an intent IDE; code documentation is optional bootstrap later
- **Status:** locked

### D-003: Spec markdown as canvas content SSOT

- **Date:** 2026-06-06
- **Decision:** Overview canvas loads card content from repo `spec/*.md`; auto-layout for positions
- **Context:** Git-tracked intent should match what humans see on the canvas overview
- **Status:** locked
