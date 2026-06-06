# AI-Inferred Decisions

Design choices made by **agents/implementers** because the user did not specify them.  
User can override any row → move to [user-decisions.md](./user-decisions.md) when confirmed.

Label in other docs: **`[AI-INFERRED]`**

See also: [documentation-guide.md](./documentation-guide.md)

---

## Frontend stack

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | React 18 + TypeScript + Vite | Default modern SPA stack for canvas/viz | Yes |
| 2026-06-06 | Tailwind CSS v4 | Fast solo styling | Yes |
| 2026-06-06 | **React Flow** (`@xyflow/react`) for main canvas | Structured graph + layered pillars; not tldraw for main canvas | Yes |
| 2026-06-06 | ~~**Zoom threshold 0.5** to enter detail layer~~ — **superseded** by click-to-drill (`drillFocusId` in canvas store) | Pillar click toggles overview ↔ detail; zoom is for pan/read only | Yes |
| 2026-06-06 | Top layer fixed 3-column layout (Frontend left, Product center, Backend right) | Matches user pillar model | Yes |
| 2026-06-06 | Detail cards use `layer: 1` + `parentCardId` | Scoped detail under Product / Frontend / Backend | Yes |
| 2026-06-06 | **Overview orphan entity cards (temp v0)** | Translator-created feature/task/decision/open-question/constraint cards use `layer: 0`, no parent/edges — visible on overview without drilling into a pillar; `OVERVIEW_ORPHAN_NEW_ENTITIES` in `canvasMapper.ts` | Yes — remove when layered UX is refined |
| 2026-06-06 | **Layer stack Overview plate click** | Only way back from detail via nav UI; drill into detail remains pillar double-click only | Yes |
| 2026-06-06 | **TipTap** for inline card editing | Rich text on cards without exposing MD | Yes |
| 2026-06-06 | **Zustand** for client state | Lightweight store for canvas/preview | Yes |
| 2026-06-06 | **Drag-to-resize panel borders** (canvas / side panel / chat bar) | IDE-style layout; sizes in `localStorage` (`nlide.layout.*`) | Yes |
| 2026-06-06 | **dagre** for auto-layout | Layout linked cards from graph | Yes |
| 2026-06-06 | react-markdown + remark-gfm for MD preview panel | Side panel agent MD preview | Yes |
| 2026-06-06 | tldraw **only** inside card for viz #21 (drawing) | Not main canvas | Yes |
| 2026-06-06 | **Milky paper canvas surface** (`#faf8f3`, plain); cards use light fills + dark text | Paper-like workspace with readable card copy; side panel stays dark glass | Yes |

---

## P0 visualizations (hackathon subset)

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | P0: Mermaid (7), TanStack Table (20), markdown table (2), force graph (13) | Balance demo value vs build time | Yes |
| 2026-06-06 | **shared/translator/** module | Single source for intent types + build phases; API + UI | Yes |
| 2026-06-06 | Build plan side panel | Phases 0–6 with per-job checklists; end of phase = Agent mode | Yes |
| 2026-06-06 | Lazy-load viz libraries per `vizType` | Keep bundle smaller | Yes |
| 2026-06-06 | Other 17 viz types → post-v0 | User listed full catalog; not all v0 | Yes |

---

## Backend & InsForge implementation

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | Single edge function **`nlide-api`** with `action` routing | Simpler deploy than many functions | Yes |
| 2026-06-06 | Edge function deploy via **esbuild bundle** → single `--file` | InsForge Subhosting does not trace multi-file local imports; vendored `_shared/translator/` + bundle | Yes |
| 2026-06-06 | TypeScript + Zod for structured LLM (planned) | Matches Edge Function runtime | Yes |
| 2026-06-06 | OpenAI SDK → InsForge Model Gateway endpoint | InsForge-compatible LLM calls | Yes |
| 2026-06-06 | Migrations in repo root **`migrations/`** | InsForge CLI convention (not `insforge/migrations/`) | Yes |
| 2026-06-06 | Postgres tables: `projects`, `cards`, `canvas_edges`, `spec_sections`, `previews` | Supports canvas + preview → commit | Yes |
| 2026-06-06 | Default project UUID `00000000-0000-4000-8000-000000000001` | Single demo project for hackathon | Yes |
| 2026-06-06 | RLS enabled with **permissive v0 policies** | Fast hackathon; tighten before production | Yes |
| 2026-06-06 | Reserved secrets auto-provisioned (`INSFORGE_BASE_URL`, `ANON_KEY`) | No manual secret setup needed on create | No — platform behavior |

---

## Translator (current stub)

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | **Full intent pipeline on `action:intent`** — router → writers → validator → mapper; stub removed | OpenRouter required; local frontend stub when env unset | Yes |
| 2026-06-06 | **Canvas mapper in `shared/translator/canvasMapper.ts`** | Applies `canvas_ops[]` or derives from router plan; auto-places preview cards | No — Phase 5 shipped |
| 2026-06-06 | Stub adds open-question card + F-004 row on any chat message | Demo-friendly predictable preview | Yes |
| 2026-06-06 | Router → writer → validator pipeline (designed, not fully implemented) | Documented architecture; stub skips LLM | Yes |

---

## Frontend ↔ API wiring

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | `VITE_INSFORGE_FUNCTION_URL` env var | Standard Vite pattern | Yes |
| 2026-06-06 | **Local stub fallback** when env unset | Dev without InsForge | Yes |
| 2026-06-06 | ~~Header badge: "InsForge" vs "Local stub"~~ Removed top header bar **[USER]** | Cleaner canvas-first chrome | Yes |
| 2026-06-06 | Sample project data in `frontend/src/data/sampleProject.ts` | Canvas demo before DB seed | Yes |
| 2026-06-06 | Card types: index, product, **frontend**, **backend**, users, feature, task, architecture, constraint, decision, open-question | Maps to spec ontology + top-layer pillars | Yes |

---

## Card & spec granularity

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | One card per entity for features/tasks (`F-001`, `T-001`) | Agent ID traceability | Yes |
| 2026-06-06 | One card per file for product/users/constraints | Less canvas clutter | Yes |
| 2026-06-06 | Stable IDs: `F-`, `T-`, `D-`, `OQ-` prefixes | Incremental updates | Yes |

---

## Repo layout

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | Flat hackathon layout: `frontend/`, `insforge/functions/`, `migrations/`, `docs/` | Solo speed | Yes |
| 2026-06-06 | Root `package.json` with InsForge CLI scripts | One place for backend commands | Yes |
| 2026-06-06 | `spec/` for exported MD (git tracked); not yet populated by export | Hybrid storage plan | Yes |
| 2026-06-06 | **Full-tree export on commit** — all nine allowlist files rewritten; mdPatches are Postgres deltas only | Phase 6 · Job 1; external agents need complete spec | Yes |
| 2026-06-06 | **Flat `spec/` layout** — no subfolders; commit returns `exportedSpec` map; disk write via dev script | Phase 6 · Job 2; edge function cannot write local repo | Yes |

---

## Superseded AI decisions

When user overrides, move row here with link to user-decisions.

| Date | Superseded decision | Replaced by |
|------|---------------------|-------------|
| 2026-06-06 | Start with Flow A (repo → MD) | **[USER]** Flow B first |
