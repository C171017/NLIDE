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
| 2026-06-06 | **React Flow** (`@xyflow/react`) for main canvas | Structured graph + Index hub; not tldraw for main canvas | Yes |
| 2026-06-06 | **TipTap** for inline card editing | Rich text on cards without exposing MD | Yes |
| 2026-06-06 | **Zustand** for client state | Lightweight store for canvas/preview | Yes |
| 2026-06-06 | **dagre** for auto-layout | Layout linked cards from graph | Yes |
| 2026-06-06 | react-markdown + remark-gfm for MD preview panel | Side panel agent MD preview | Yes |
| 2026-06-06 | tldraw **only** inside card for viz #21 (drawing) | Not main canvas | Yes |

---

## P0 visualizations (hackathon subset)

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | P0: Mermaid (7), TanStack Table (20), markdown table (2), force graph (13) | Balance demo value vs build time | Yes |
| 2026-06-06 | Lazy-load viz libraries per `vizType` | Keep bundle smaller | Yes |
| 2026-06-06 | Other 17 viz types → post-v0 | User listed full catalog; not all v0 | Yes |

---

## Backend & InsForge implementation

| Date | Decision | Rationale | Revisable? |
|------|----------|-----------|------------|
| 2026-06-06 | Single edge function **`nlide-api`** with `action` routing | Simpler deploy than many functions | Yes |
| 2026-06-06 | Edge function as **single bundled `index.ts`** | InsForge deploy uploads one file; multi-file imports fail | Yes — if CLI supports bundles |
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
| 2026-06-06 | **Stub `buildPreview()`** mirrors frontend mock | Prove preview → commit loop before real LLM router/writers | Yes — replace next |
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
| 2026-06-06 | Card types: index, product, users, feature, task, architecture, constraint, decision, open-question | Maps to spec ontology | Yes |

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

---

## Superseded AI decisions

When user overrides, move row here with link to user-decisions.

| Date | Superseded decision | Replaced by |
|------|---------------------|-------------|
| 2026-06-06 | Start with Flow A (repo → MD) | **[USER]** Flow B first |
