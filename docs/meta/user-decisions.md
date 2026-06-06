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
| 2026-06-06 | **Agents explain with plain reframe first** — “what we’re basically building” in one sentence, then what we need from user, then progress x/y | See [communication-style.md](./communication-style.md) |
| 2026-06-06 | **Chat box → translator → canvas preview → user commit or discard** | Never auto-apply translator output |
| 2026-06-06 | **User can edit individual cards anytime** | Manual card edit is important; separate from AI chat batch |
| 2026-06-06 | **Design loop:** define a lot → run AI once → edit canvas manually → run AI again | Not continuous agent loops |
| 2026-06-06 | **Whole web app is a canvas** with linked cards and **central node** | Human-readable, easy to edit cards |
| 2026-06-06 | **Layered canvas navigation** — top layer: **Frontend · Product · Backend** (Product center); detail cards appear when **clicking** a top pillar; click the same pillar again returns to overview | Spatial hierarchy mirrors product structure |
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

## Translator / router contract

| Date | Decision | Context |
|------|----------|---------|
| 2026-06-06 | **v0 intent types approved** — routing policy & ten-type list | `shared/translator/intentTypes.ts`; see [router-intent-types-v0.md](../architecture/router-intent-types-v0.md) |
| 2026-06-06 | **`intent_type` enum locked for v0** — `add_feature` … `noop` | May revise before Phase 2 router + golden tests; canonical union in `shared/translator/types.ts` |
| 2026-06-06 | **Router output schema locked for v0** — `intent_type`, `summary`, `operations[]`, `canvas_ops[]`, `open_questions[]` | Hardcoded shape in `shared/translator/intentTypes.ts`; LLM does not invent new top-level fields |
| 2026-06-06 | **Spec file allowlist locked for v0** — nine Flow B files (`INDEX.md` … `open-questions.md`) | `SPEC_FILE_ALLOWLIST` in `shared/translator/intentTypes.ts` |
| 2026-06-06 | **Golden prompts approved (10 cases)** | `shared/translator/goldenPrompts.ts`; covers 9/10 intent types directly (`add_task` via add_feature co-target) |
| 2026-06-06 | **Router golden pass bar locked: ≥8/10** | `GOLDEN_PASS_BAR` in `shared/translator/goldenPrompts.ts`; Phase 1 complete |
| 2026-06-06 | **Router system prompt outline approved** | `shared/translator/routerPromptOutline.ts`; Phase 2 · Job 1 complete |
| 2026-06-06 | **Golden router fixture approved (10 cases)** | `shared/translator/goldenRouterFixture.ts` + `goldenRouterMatch.ts`; Phase 2 · Job 2 complete |
| 2026-06-06 | **Router failure behavior approved** — fail loud, no stub fallback | `shared/translator/routerFailureBehavior.ts`; Phase 2 · Job 3 complete |
| 2026-06-06 | **Router smoke invoke brief approved** | `shared/translator/routerSmokeInvoke.ts`; Phase 2 complete (4/4) |

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
| 2026-06-06 | **Central node is Product** (not Index hub); top layer = Frontend · Product · Backend; detail layer via pillar click |
| 2026-06-06 | ~~**Detail zoom-out threshold lowered to 0.5**~~ — **superseded**: layer navigation is click-to-drill, not zoom threshold |
| 2026-06-06 | **Click-to-drill layer navigation** — click a top pillar to show its sub-cards; click the same pillar again to return to overview; no zoom-based layer transition |
| 2026-06-06 | **Router contract jobs 1–4 locked (v0)** — policy, enum, schema, allowlist |
