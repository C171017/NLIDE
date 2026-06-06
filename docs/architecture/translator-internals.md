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
2. Writer LLM(s) → one call per target file/section
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
| Stub `buildPreview()` on `intent` | ✅ Live (no LLM) |
| Router LLM (`action:route`) | ✅ Implemented — `router/routeIntent.ts`; needs `OPENROUTER_API_KEY` |
| Golden router batch (`action:route-golden`) | ✅ Implemented |
| Writer LLM(s) | ❌ Not implemented |
| Validator | ❌ Minimal (router Zod + business rules only) |
| Model Gateway (Claude Sonnet) | ✅ Wired via OpenRouter when secret set |

**[USER]** Real translator must still use **preview → commit** — never auto-apply.

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
2. Router only — validate JSON routing on test prompts  
3. One writer (`features.md`)  
4. All writers + validator  
5. Commit + `/spec/*.md` export  
6. Replace stub in `insforge/functions/nlide-api/index.ts`

When each step ships, update [current-state.md](../implementation/current-state.md).

---

## InsForge vs translator

```
React app  ──POST──►  nlide-api (Edge Function)
                           │
                           ├──► Postgres (context + previews)
                           └──► OpenRouter (Claude Sonnet) — `action:route` when `OPENROUTER_API_KEY` set
```

Function URL: see [insforge/README.md](../../insforge/README.md)
