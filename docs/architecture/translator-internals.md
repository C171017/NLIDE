# Translator Internals

How the **AI translator** works inside `nlide-api`.  
**[AI-INFERRED]** architecture — replace stub when implementing Claude router/writers.

See: [flow-b-v0.md](./flow-b-v0.md) · [router-intent-types-v0.md](./router-intent-types-v0.md) · [current-state.md](../implementation/current-state.md) · [workflow.md](../product/workflow.md)

---

## Role

InsForge hosts the runtime; **you build the translator logic** in the edge function.

| InsForge provides | NLIDE builds |
|-------------------|--------------|
| Edge Functions runtime | `nlide-api` handler |
| Postgres | Canvas + preview storage |
| Model Gateway (Claude) | Router + writer prompts (planned) |
| Sites (optional) | React frontend hosting |

---

## Batch pipeline (on chat Send)

```
User chat message + full canvas/spec context
        ↓
1. Router LLM → JSON plan (which spec files / cards to touch)
        ↓
2. Writer LLM(s) → one call per **operation** (loops when compound message targets same file multiple times)
        ↓
3. Validator (code rules + optional cheap LLM)
        ↓
4. Canvas mapper → preview cards, edges, positions
        ↓
5. Save to previews table → return previewId (NOT committed)
        ↓
User Commit or Discard
```

**Manual card edit** (`patch-card`) bypasses this pipeline — writes directly to Postgres.

---

## Current implementation status

| Step | Status |
|------|--------|
| API routing (`action` field) | ✅ Live |
| Preview storage | ✅ Live |
| Commit / discard | ✅ Live |
| Stub `buildPreview()` on `intent` | ❌ Removed — **`action:intent`** runs router → writers → validator → mapper |
| Full intent pipeline (`action:intent`) | ✅ Live — `intent/buildIntentPreview.ts`; needs `OPENROUTER_API_KEY`; no stub fallback |
| Canvas mapper | ✅ **Implemented** — `shared/translator/canvasMapper.ts`; golden via `action:canvas-mapper-golden` |
| Preview diff (ghost styling) | ✅ **Implemented** — `shared/translator/diffPreview.ts` + `IntentCanvas.tsx` |
| Router LLM (`action:route`) | ✅ Implemented — `router/routeIntent.ts`; needs `OPENROUTER_API_KEY` |
| Golden router batch (`action:route-golden`) | ✅ Implemented |
| Writer LLM(s) | ✅ Phase 3–4 implemented — features, tasks, remaining |
| Validator | ✅ Phase 4 — `validateSpec()` on `action:run-writers` |
| Model Gateway (role-based) | ✅ Haiku 4.5 router · Sonnet 4 writers/planner via OpenRouter when secret set |

**[USER]** Real translator must still use **preview → commit** — never auto-apply.

---

## Compound intents (multi-card turns) `[AI-INFERRED]`

When one chat message contains **multiple distinct spec asks** (e.g. two features, or feature + constraint + decision):

1. **Router** still returns one `intent_type` (dominant ask, usually `add_feature`) but emits:
   - Multiple `operations[]` entries — duplicate targets allowed with distinct `entity_id`
   - Ordered `canvas_ops[]` with one `create_card` per new card (preferred over empty `canvas_ops`)
2. **Writers** loop `findAllOperations(plan, target)` — one LLM call per op; `focus_operation` in payload scopes each write
3. **Mapper** applies all `canvas_ops` in order; writes ordered `PreviewPayload.previewCardIds` for per-card review; `focusCardId` remains a compatibility hint
4. **Frontend** opens the Card editor on the first queued preview card, highlights the current card, and advances after each Commit/Discard

Golden cases: `gp-11-multi-feature`, `gp-12-compound-mixed` in `goldenPrompts.ts` / `goldenRouterFixture.ts`. Pass bar: ≥10/12.

---

## Router output shape (planned)

```json
{
  "intent_type": "add_feature",
  "operations": [
    { "target": "features.md", "action": "add", "entity_id": "F-002" },
    { "target": "tasks.md", "action": "add", "entity_id": "T-003" }
  ],
  "canvas_ops": [
    { "action": "create_card", "type": "feature", "id": "F-002", "link_to": "index" }
  ],
  "open_questions": []
}
```

---

## Build order (recommended)

1. Stub preview (done) — prove UX loop  
2. Router only (done) — validate JSON routing on test prompts  
3. One writer (`features.md`) (done)  
4. All writers + validator (done)  
5. Canvas mapper + preview diff (done) — `mapCanvasToPreview()`  
6. Commit + `/spec/*.md` export — ✅ shipped  
7. Wire router + writers → `action:intent` end-to-end — ✅ shipped

When each step ships, update [current-state.md](../implementation/current-state.md).

---

## InsForge vs translator

```
React app  ──POST──►  nlide-api (Edge Function)
                           │
                           ├──► Postgres (context + previews)
                           └──► OpenRouter — Haiku router / Sonnet writers when `OPENROUTER_API_KEY` set
```

Function URL: see [insforge/README.md](../../insforge/README.md)
