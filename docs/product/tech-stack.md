# Tech Stack — Locked Choices

Solo hackathon build. All product and stack decisions are **locked** below.

**Labels:** **[USER]** = explicit user choice · **[AI-INFERRED]** = agent default — see [meta/user-decisions.md](./meta/user-decisions.md) and [meta/ai-inferred-decisions.md](./meta/ai-inferred-decisions.md).  
**Live deploy:** [implementation/current-state.md](./implementation/current-state.md)  
**Agent doc rules:** [meta/documentation-guide.md](./meta/documentation-guide.md)

See [Canvas UI](./canvas-ui-vision.md) · [Workflow](./workflow.md) · [Execution phases (future)](./execution-phases.md)

---

## Solo project

One developer. Minimize languages, infra, and moving parts. Web first; Tauri/macOS later.

---

## Locked product decisions `[USER]`

| # | Decision | Choice |
|---|----------|--------|
| **1** | Approval gate | **Preview → Commit** via chat; never auto-apply |
| **2** | Spec storage | **Hybrid (C)** — Postgres at runtime; export `/spec/*.md` on commit |
| **3** | Hosting | **InsForge Sites** primary; fallback **Cloudflare Pages** + **Neon** + custom domain |
| **4** | LLM model | **Claude Sonnet** via InsForge Model Gateway (`anthropic/claude-sonnet-4` or latest Sonnet slug) |

### Workflow (locked)

- **Chat box** → translator (batch, full context) → **canvas preview** → user **commit or discard**
- User **edits individual cards** anytime (manual, no AI)
- **Not** real-time agent execution — define intent on canvas first; external agents run later with full spec
- v0 focus: canvas, structure, knowledge, viz — not Flow C execution

Full detail: **[workflow.md](./workflow.md)**

---

## InsForge — primary backend

Hackathon sponsor. Use for backend + hosting when possible.

| InsForge product | NLIDE use |
|------------------|-----------|
| **Postgres** | Projects, cards, spec sections, canvas layout, preview drafts |
| **Edge Functions** | Batch translator API (`POST /intent` → preview; `POST /commit`) |
| **Model Gateway** | Claude Sonnet — OpenAI-compatible endpoint |
| **Storage** | Optional MD bundle backup |
| **Sites** | **Primary frontend hosting** |

```
┌─────────────────┐         ┌──────────────────────────────┐
│  React + Vite   │  HTTPS  │  InsForge                    │
│  React Flow     │ ◄─────► │  Edge Functions (translator) │
│  TipTap + viz   │         │  Postgres (spec + canvas)    │
└─────────────────┘         │  Model Gateway (Claude)      │
         ▲                  │  Sites (frontend deploy)     │
         │                  └──────────────────────────────┘
    custom domain
    (InsForge Sites or Cloudflare)
```

**Setup:** `npx @insforge/cli login` → `link` → migrations + edge functions + Sites deploy.  
Docs: [docs.insforge.dev](https://docs.insforge.dev) · [llms.txt](https://insforge.dev/llms.txt)

---

## Hosting fallback (if InsForge Sites insufficient)

Use your **custom domain** on whichever path works at hackathon time.

| Layer | Primary | Fallback |
|-------|---------|----------|
| **Frontend** | InsForge Sites | **Cloudflare Pages** (Vite build) |
| **API / orchestrator** | InsForge Edge Functions | Cloudflare Workers or keep InsForge Edge only |
| **Database** | InsForge Postgres | **Neon** Postgres (if DB must move off InsForge) |
| **LLM** | InsForge Model Gateway | Direct Anthropic API (last resort; loses sponsor integration) |

**Pragmatic split:** InsForge Edge Functions + Model Gateway + Postgres even if frontend moves to Cloudflare Pages — backend stays on InsForge for sponsor story.

Custom domain: point DNS to InsForge Sites or Cloudflare Pages depending on active frontend host.

---

## Locked stack `[AI-INFERRED]` unless noted in user-decisions

| Area | Choice |
|------|--------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **Canvas** | React Flow (`@xyflow/react`) + dagre layout |
| **Card editing** | TipTap — individual card inline edit |
| **Client state** | Zustand (canvas, preview draft, committed state) |
| **MD preview** | react-markdown + remark-gfm |
| **Backend** | InsForge Edge Functions (TypeScript) |
| **Structured LLM** | Zod schemas + OpenAI SDK → InsForge gateway |
| **LLM model** | **[AI-INFERRED]** Haiku 4.5 router + Sonnet 4 writers/planner (see `openRouter.ts`) |
| **Persistence** | InsForge Postgres + export `/spec/*.md` on commit |
| **Card granularity** | One card per entity (F-001, T-001); one per file for product/users/constraints |
| **P0 viz** | Mermaid (7), TanStack Table (20), MD table (2), force graph (13) |
| **Viz loading** | Lazy per `vizType` |
| **Flow scope** | Flow B design loop only; no in-app execution |
| **Drawing viz** | tldraw embed inside card only (viz #21) |

---

## API shape (batch translator)

```typescript
// POST /intent — batch translate, returns PREVIEW only
{
  message: string,           // chat input
  projectId: string,
  includeFullContext: true   // entire canvas + spec
}
→ { preview: { cards, edges, mdPatches, summary }, previewId }

// POST /commit — apply preview
{ previewId: string }
→ { committed: true, exportedSpecPath: "/spec/..." }

// POST /discard
{ previewId: string }

// PATCH /cards/:id — manual card edit (no AI)
{ title, body, ... }
→ sync MD section in Postgres; no export until next commit batch optional
```

Card manual edits sync to Postgres immediately; re-export `/spec/*.md` on commit or debounced save (implementer choice — prefer export on commit for clarity).

---

## Repo layout

```
NLIDE/
  frontend/          # React + Vite + React Flow
  insforge/
    functions/nlide-api/index.ts
  migrations/        # Postgres migrations (InsForge CLI)
  spec/              # Exported MD on commit (git tracked)
  docs/
```

---

## Visualization libraries (P0)

| # | Type | Library |
|---|------|---------|
| 2 | Markdown table | react-markdown + GFM |
| 7 | Mermaid | mermaid |
| 13 | Force-directed graph | react-force-graph-2d |
| 20 | Live data table | TanStack Table |

---

## Hackathon build order (solo)

1. InsForge project + Postgres schema (projects, cards, spec_sections, edges, previews)
2. Edge Function: `POST /intent` stub → preview response
3. React Flow canvas + Index center node + chat box
4. Preview overlay (ghost cards) + Commit / Discard buttons
5. Model Gateway: real router + writer (Claude Sonnet)
6. TipTap per-card edit + `PATCH /cards/:id`
7. Commit → Postgres apply + export `/spec/*.md`
8. P0 viz on Architecture + Features cards
9. Deploy: InsForge Sites → fallback Cloudflare Pages + custom domain

Skip: in-app execution, live agent streaming, auth, collaboration, 17 extra viz types, Tauri, Flow A, phase planner.

---

## Future

- **Execution phase planner** — AI breaks work into N phases; still batch, not real-time. [execution-phases.md](./execution-phases.md)
- **Tauri** — wrap same React app; keep InsForge API or local sidecar
- **Flow C** — external agent reads exported `/spec` when user is ready

---

## Summary

| Layer | Locked choice |
|-------|----------------|
| UX | Chat → preview → commit; manual card edit; batch AI only |
| Storage | Postgres + MD export on commit |
| Backend | InsForge (Edge Functions, Postgres, Model Gateway) |
| Frontend host | InsForge Sites → Cloudflare Pages fallback |
| DB fallback | Neon (only if needed) |
| LLM | Claude Sonnet via InsForge gateway |
| Canvas | React Flow + TipTap + P0 viz set |

All four prior open decisions are resolved. Build from this doc.
