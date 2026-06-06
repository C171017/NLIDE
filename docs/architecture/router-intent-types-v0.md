# Router Intent Types — v0 Draft

**Status: APPROVED by user (2026-06-06).** Canonical copy lives in `shared/translator/intentTypes.ts`.  
This doc remains the narrative reference; edit the shared module for runtime changes.

**Plain summary:** We’re building a **fixed checklist of intent types**. When someone types in the NLIDE **chat box**, the router picks one type (or several file operations), then later steps fill in the words.

See: [flow-b-v0.md](./flow-b-v0.md) · [translator-internals.md](./translator-internals.md) · [communication-style.md](../meta/communication-style.md)

---

## Sources

Built from **user messages** across NLIDE project chats (Cursor sessions), grouped by what the request was really about.

**Not every past message belongs in NLIDE chat.** Many were about building NLIDE itself in Cursor, asking for explanations, or editing UI — those are listed under [Out of scope for NLIDE chat](#out-of-scope-for-nlide-chat-noop).

---

## v0 intent types (NLIDE canvas chat)

These are the buckets the **router** must choose from. Each row: plain name → what to do in spec → example from your chats.

| # | Plain name | `intent_type` | What the router does | Example from your chats |
|---|------------|---------------|----------------------|-------------------------|
| 1 | **New thing to build** | `add_feature` | Add row in `features.md` (+ usually add `tasks.md`) | “Add Google login for enterprise users” (Flow B example) |
| 2 | **Change something we already defined** | `update_feature` | Update existing feature ID (body, status, priority, acceptance) | “Canvas should pan and zoom”; “card for canvas design and behavior like pan” → **update F-001**, not open question |
| 3 | **Work for an agent to do later** | `add_task` | Add `tasks.md` entry linked to a feature | Comes with new features; or “add task to implement pan controls” |
| 4 | **Change a task** | `update_task` | Update existing `T-xxx` | “Mark T-001 done”; “split T-001 into two tasks” |
| 5 | **Who it’s for / why we’re building** | `update_product` | Patch `product.md` and/or `users.md` | Vision doc: product vision, users, pain points |
| 6 | **How the system fits together** | `update_architecture` | Patch `architecture.md` (no file paths as main content) | “React frontend, InsForge edge functions…”; layered canvas zoom design (product structure) |
| 7 | **Rule we must follow or limit** | `add_constraint` | Add/patch `constraints.md` | “Not real-time agent execution”; “Flow C out of scope”; “no mobile in v0” |
| 8 | **Choice we already settled** | `add_decision` | Add `decisions.md` entry | “Start with Flow B”; “Hybrid storage C”; “Claude Sonnet”; “Web app first” |
| 9 | **We don’t know yet — ask me** | `clarify` | Add `open_questions.md` only; **no guessing** | “Which Google domains are allowed?”; vague “make it nice” |
| 10 | **Nothing to write to spec** | `noop` | Empty `operations`; optional short summary | Chat about building NLIDE in Cursor, explanations, meta/process (see below) |

---

## Routing rules (draft — edit freely)

Short policy list derived from your requests. Router + golden tests should enforce these.

1. **Canvas interaction** (pan, zoom, drag, layers) → `update_feature` on **F-001** (+ `add_task` if new implementation work). **Not** `clarify` by default.
2. **New product capability** → `add_feature` + `add_task`.
3. **Scope / non-goals / “we’re not doing X”** → `add_constraint`.
4. **Resolved “we picked X”** → `add_decision`.
5. **Missing info or real ambiguity** → `clarify` → `open_questions.md` only.
6. **Intent wording, not code** — route “users can pan”, not “set React Flow minZoom”.
7. **Prefer update over add** when an existing card/ID already covers the topic.
8. **Never** create open question on every message (stub behavior — wrong).

---

## Mapped examples from your past chats

### Belongs in NLIDE chat (spec intent)

| Your words (paraphrased) | Type | Route |
|--------------------------|------|-------|
| Card for canvas design & behavior like pan | `update_feature` | `features.md` update **F-001** |
| Reorganize canvas: product center, frontend left, backend right, zoom layers | `update_feature` + `update_architecture` | F-001 + `architecture.md` (canvas IA) |
| Chat → translator → preview → commit; edit cards manually; batch not realtime | `add_decision` / `add_constraint` | `decisions.md` + `constraints.md` |
| User input → structured docs for agents (Flow B) | `update_product` | `product.md` / `INDEX.md` scope |
| Define everything first, agents execute later with full spec | `add_constraint` | non-goals in `constraints.md` |

### Out of scope for NLIDE chat (`noop`)

These appeared in Cursor chats but are **not** what the NLIDE canvas chat box is for:

| Your words (paraphrased) | Why noop |
|--------------------------|----------|
| Why only open question preview? / is translator broken? | Diagnosis — not spec content |
| Step by step vs one go? / what decisions need approval? | Process planning in Cursor |
| Hardcoded schema? | Design discussion |
| Progress bar on canvas / delete header bar / remove card editor | **Building NLIDE** — Cursor agent work |
| Set up InsForge / set up frontend | Infra & implementation |
| What does schema mean? / LLM leaderboard / Claude Pro | Education & tooling — not product spec |
| Modify md / save to doc / reflect design to document | Doc edits via Cursor |
| Git rebase then push | Repo ops |

---

## Schema shape (hardcoded — LLM fills slots)

Router output stays fixed; the model only picks values inside it:

```json
{
  "intent_type": "update_feature",
  "summary": "One plain sentence",
  "operations": [
    { "target": "features.md", "action": "update", "entity_id": "F-001" }
  ],
  "canvas_ops": [],
  "open_questions": []
}
```

Allowed `target` files (v0): `INDEX.md`, `product.md`, `users.md`, `features.md`, `architecture.md`, `tasks.md`, `constraints.md`, `decisions.md`, `open_questions.md`.

---

## Review checklist (for you)

- [x] Types 1–10 names and boundaries feel right — **[USER]** 2026-06-06
- [x] Canvas UX → update F-001 — **[USER]** yes
- [x] Layered canvas / product-center layout → architecture + feature — **[USER]** yes
- [x] `noop` list matches what chat should ignore — **[USER]** yes
- [x] **Routing policy** ticked (1/6)
- [x] **`intent_type` enum locked** ticked (2/6)
- [x] **Hardcoded schema fields** ticked (3/6)
- [x] **Spec file allowlist** ticked (4/6)

---

## Change log

| Date | Change |
|------|--------|
| 2026-06-06 | **[AI-INFERRED]** Initial draft from past chat mining — **awaiting [USER] review** |
