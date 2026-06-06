# User-Defined Decisions

Decisions the **user explicitly stated**. Agents must not override these without user confirmation.

Label in other docs: **`[USER]`**

See also: [documentation-guide.md](./documentation-guide.md) · [ai-inferred-decisions.md](./ai-inferred-decisions.md)

---

## Product vision & scope

| Date | Decision | Context |
|------|----------|---------|
| 2026-06-06 | **Primary artifact is intent, not code** | NLIDE is an IDE for intent |
| 2026-06-06 | **Flow B first** — human input → intent MD | Not Flow A (repo → MD) as primary path |
| 2026-06-06 | **Flow C out of scope** — execution via external agents (Cursor, Replicas), not in NLIDE v0 | No in-app code execution |
| 2026-06-06 | **Intent docs, not code docs** | Describe what user wants, not how existing code works |
| 2026-06-06 | **Define first, execute later** | Build clear picture on canvas; agents run with full spec after export |
| 2026-06-06 | **Not real-time agent execution** | Batch translator runs on chat submit; no streaming copilot on canvas |
| 2026-06-06 | **v0 focus: canvas, structure, knowledge, viz** | Not full IDE chrome or Flow C |

---

## UX & workflow

| Date | Decision | Context |
|------|----------|---------|
| 2026-06-06 | **Chat box → translator → canvas preview → user commit or discard** | Never auto-apply translator output |
| 2026-06-06 | **User can edit individual cards anytime** | Manual card edit is important; separate from AI chat batch |
| 2026-06-06 | **Design loop:** define a lot → run AI once → edit canvas manually → run AI again | Not continuous agent loops |
| 2026-06-06 | **Whole web app is a canvas** with linked cards and **central node** | Human-readable, easy to edit cards |
| 2026-06-06 | **Layered canvas navigation** — top layer: **Frontend · Product · Backend** (Product center); detail cards (Users, Architecture, Features, Tasks, etc.) appear when selecting a top card and **zooming past a threshold**; zoom out returns to overview | Spatial hierarchy mirrors product structure |
| 2026-06-06 | **Each card has agent-executable MD underneath** | Human layer + agent layer per card |
| 2026-06-06 | **Rich visualization & interactivity** on canvas (21 viz types listed as aspirational catalog) | Implement subset for v0 |

---

## Storage & determinism

| Date | Decision | Context |
|------|----------|---------|
| 2026-06-06 | **Hybrid spec storage (C)** | Postgres at runtime; export `/spec/*.md` on commit |
| 2026-06-06 | **Clear MD → near-deterministic execution** | Acceptance criteria + tasks so external agents need little guesswork |

---

## Stack & hosting

| Date | Decision | Context |
|------|----------|---------|
| 2026-06-06 | **Web app first**; macOS native (Tauri) later | Hackathon speed |
| 2026-06-06 | **Solo project** | One developer |
| 2026-06-06 | **Use InsForge** as backend (hackathon sponsor) | Postgres, Edge Functions, Model Gateway |
| 2026-06-06 | **Agentic Dev Tools Hackathon** context | InsForge co-host; sponsor story for backend |
| 2026-06-06 | **Hosting:** InsForge Sites if available; else **Cloudflare Pages** + **Neon** + custom domain | User has domain |
| 2026-06-06 | **LLM: Claude Sonnet** via InsForge Model Gateway | User choice #4 |

---

## Deferred / explicitly not now

| Date | Decision | Context |
|------|----------|---------|
| 2026-06-06 | **Flow A deferred** | Optional import/bootstrap later with translate layer into intent |
| 2026-06-06 | **Execution phase planner deferred** | Future: AI decides phase count for execution |
| 2026-06-06 | **Mem0 / vector memory not v0** | Structured MD is memory for now |

---

## Change log

When user overrides a decision, add a row here and strike through or mark superseded in the table above.

| Date | Change |
|------|--------|
| 2026-06-06 | **Central node is Product** (not Index hub); top layer = Frontend · Product · Backend; detail layer via zoom |
