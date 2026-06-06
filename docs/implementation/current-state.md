# Implementation — Current State

What exists **in the repo and deployed** as of last update.  
When code or infra changes, **update this file** (see [documentation-guide.md](../meta/documentation-guide.md)).

---

## Live infrastructure `[USER requested InsForge]` `[AI-INFERRED deploy details]`

| Item | Value |
|------|--------|
| InsForge project | **NLIDE** (`c23614f7-c822-460e-a84b-86363965b78c`) |
| Dashboard | https://insforge.dev/dashboard/project/c23614f7-c822-460e-a84b-86363965b78c |
| API base | `https://4yqeeuk9.us-east.insforge.app` |
| Edge function | **`nlide-api`** — `https://4yqeeuk9.us-east.insforge.app/functions/nlide-api` |
| Alt function URL | `https://4yqeeuk9.functions.insforge.app/nlide-api` |
| Postgres migration | `migrations/20260606180626_nlide-schema.sql` — **applied** |
| Local link | `.insforge/project.json` (gitignored) |
| Frontend env | `frontend/.env.local` → `VITE_INSFORGE_FUNCTION_URL` set |

Setup commands: [insforge/README.md](../../insforge/README.md)

---

## Built — frontend `[AI-INFERRED]`

| Component | Path / notes |
|-----------|----------------|
| React + Vite + TS app | `frontend/` |
| Intent canvas | `frontend/src/components/canvas/IntentCanvas.tsx` |
| **Layered canvas** (overview ↔ detail via pillar double-click; single-click select) | `canvasLayers.ts`, `layout.ts`, `IntentCanvas.tsx` |
| Canvas nav (tilted layer stack — click Overview plate to return from detail; drill in via pillar double-click; fullscreen toggle; minimap detached but hidden) | `CanvasNavPanel.tsx`, `LayerStackIndicator.tsx` |
| Card nodes + Product hub | `CardNode.tsx`, `IndexNode.tsx` (center pillar styling); long-press delete mode with trash drop zone |
| Chat input (floating on canvas) + preview actions in side panel | `ChatBar.tsx`, `ChatSubmitButton.tsx`, `PreviewActions.tsx` — circular interpret/stop control; Enter submits |
| TipTap card editor | `CardEditor.tsx` — title/body edit + **spec MD file panel** (`SpecFilePanel.tsx`, `useSpecFileContent.ts`) |
| Side panel | `SidePanel.tsx` — **Build plan** tab (phases + jobs) + Card editor tab |
| **Resizable layout** | `AppShell.tsx`, `ResizeHandle.tsx`, `CornerResizeHandle.tsx`, `useResizableSize.ts` — drag borders between canvas and side panel; preview summary height in card tab; canvas nav minimap corner resize; sizes persist in `localStorage` |
| Translator spec (shared) | `shared/translator/` — intent types, routing rules, build phases, **golden prompts** |
| Backend translator module | `insforge/functions/nlide-api/translator/` |
| Build phases UI | `BuildPhasesPanel.tsx`, `PhaseJobList.tsx`, `PhaseExecutionPanel.tsx` — Agent / You columns |
| Phase execution map | `shared/translator/phaseExecution.ts` — shipped status + human task list per phase |
| P0 viz embeds | Mermaid, markdown table, force graph, data table, **progress-checklist** |
| Step 1 progress card | `translator-step1` task card — Phase 5 **shipped**; Phase 6 active |
| Router prompt outline | `shared/translator/routerPromptOutline.ts` — Phase 2 · Job 1 **approved** |
| Golden router fixture | `shared/translator/goldenRouterFixture.ts` — Phase 2 · Job 2 **approved** |
| Router failure behavior | `shared/translator/routerFailureBehavior.ts` — Phase 2 · Job 3 **approved** |
| Router smoke invoke | `shared/translator/routerSmokeInvoke.ts` — Phase 2 · Job 4 **approved** |
| Features writer template | `shared/translator/featuresWriterTemplate.ts` — Phase 3 · Job 1 **approved** |
| Acceptance criteria bar | `shared/translator/acceptanceCriteriaBar.ts` — Phase 3 · Job 2 **approved** |
| Features writer golden | `shared/translator/featuresWriterGolden.ts` — Phase 3 · Job 3 **approved** |
| Task writer rules | `shared/translator/taskWriterRules.ts` — Phase 4 · Job 1 **approved** |
| Validator strictness | `shared/translator/validatorStrictness.ts` — Phase 4 · Job 2 **approved** |
| Remaining writers order | `shared/translator/remainingWritersOrder.ts` — Phase 4 · Job 3 **approved** |
| Canvas placement rules | `shared/translator/canvasPlacementRules.ts` — Phase 5 · Job 1 **approved** |
| Canvas ops mapping | `shared/translator/canvasOpsMapping.ts` — Phase 5 · Job 2 **approved** |
| Preview diff rules | `shared/translator/previewDiffRules.ts` — Phase 5 · Job 3 **approved** |
| Export scope on commit | `shared/translator/exportScopeOnCommit.ts` — Phase 6 · Job 1 **approved** |
| spec/ folder layout | `shared/translator/specFolderLayout.ts` — Phase 6 · Job 2 **approved** |
| Export end-to-end smoke | `shared/translator/exportEndToEndSmoke.ts` — Phase 6 · Job 3 **approved** |
| Write spec to disk helper | `scripts/write-exported-spec.mjs` — `npm run write:spec` |
| **Canvas mapper (Phase 5)** | `shared/translator/canvasMapper.ts` — `mapCanvasToPreview()`, placement + `canvas_ops` derivation; **temp v0:** new entity cards (`F-*`, `T-*`, etc.) placed on overview (`layer: 0`, no pillar link) via `OVERVIEW_ORPHAN_NEW_ENTITIES` |
| **Preview diff (shared)** | `shared/translator/diffPreview.ts` — ghost card/edge id diff; used by `IntentCanvas.tsx` |
| Canvas mapper golden | `shared/translator/canvasMapperGolden.ts` — 5 cases, ≥4/5 pass bar |
| Implementation progress store | `implementationProgressStore.ts` — persists checklist ticks in localStorage |
| Canvas state (Zustand) | `frontend/src/store/canvasStore.ts` — **loads from `spec/*.md` on startup** via `loadSpecCanvas.ts` |
| **Spec → canvas loader** | `shared/translator/specToCanvas.ts` — `buildCanvasFromSpec()` parses Flow B markdown into layered cards + edges; tasks link to Frontend/Backend via **Pillar:** |
| API client + local stub | `frontend/src/lib/api.ts`, `translatorStub.ts` — stub uses `mapCanvasToPreview()` |
| Sample demo canvas | `frontend/src/data/sampleProject.ts` — **legacy reference only** (superseded by spec load) |
| **Seeded NLIDE spec** | `spec/` — F-001…F-006, T-001…T-009 (frontend pillar), D-001…D-003, architecture Frontend component inventory |

Run: `npm run dev` (from repo root)

---

## Built — backend `[AI-INFERRED]`

| Component | Path / notes |
|-----------|----------------|
| Edge function (bundled) | `insforge/functions/nlide-api/index.ts` — deploy uses `bundle:api` → `dist/index.ts` (vendors `_shared/translator/`) |
| **Router (Phase 2)** | `insforge/functions/nlide-api/router/` — `routeIntent()`, Zod, `action:route`, `action:route-golden` |
| **Features writer (Phase 3)** | `insforge/functions/nlide-api/writers/` — `writeFeaturesSection()`, `action:write-features`, `action:write-features-golden` |
| **Task + remaining writers (Phase 4)** | `taskWriter.ts`, `remainingWriter.ts`, `pipeline.ts` — `action:write-tasks`, `action:write-remaining`, `action:run-writers` |
| **Canvas mapper (Phase 5)** | `shared/translator/canvasMapper.ts` — wired into stub `buildPreview()` on `action:intent` |
| **Spec export (Phase 6)** | `shared/translator/specExport.ts`, `export/specStore.ts`, `export/exportSmoke.ts` — commit returns `exportedSpec` |
| **Spec validator (Phase 4)** | `validator/validateSpec.ts` — `action:validate-spec`; wired into commit export |
| Translator preview | **`action:intent`** — router → writers → validator → canvas mapper (requires `OPENROUTER_API_KEY`) |
| DB access | `@insforge/sdk` in edge function |

### API actions (live)

| action | Status |
|--------|--------|
| `health` | ✅ Deployed (+ `routerConfigured`) |
| `route` | ✅ **Implemented** — needs `OPENROUTER_API_KEY` secret |
| `route-golden` | ✅ **Implemented** — batch golden router tests |
| `write-features` | ✅ **Implemented** — needs `OPENROUTER_API_KEY` secret |
| `write-features-golden` | ✅ **Implemented** — batch features writer golden (≥3/4 bar) |
| `write-tasks` | ✅ **Implemented** — tasks.md writer |
| `write-remaining` | ✅ **Implemented** — product/users/architecture/constraints/decisions/open-questions |
| `run-writers` | ✅ **Implemented** — all writers + validator for one router plan |
| `validate-spec` | ✅ **Implemented** — ID/link/content validation |
| `phase4-smoke` | ✅ **Implemented** — gp-03 writers + validator smoke |
| `canvas-mapper-golden` | ✅ **Implemented** — 5 mapper cases, ≥4/5 pass bar |
| `intent` | ✅ Router + writers + mapper → preview (needs `OPENROUTER_API_KEY`; no stub fallback) |
| `commit` | ✅ Applies preview to `cards` / `canvas_edges` + **`exportedSpec`** (9 files) |
| `export-smoke` | ✅ **Implemented** — headless assemble + validation (no DB) |
| `discard` | ✅ Deletes preview row |
| `patch-card` | ✅ Updates card in Postgres |
| `get-spec-file` | ✅ Assembles one spec file from `spec_sections` |
| `get-translator-spec` | ✅ Intent types, routing rules, build phases, golden prompts |
| `get-project` | ✅ Loads from DB (empty until commit seeds data) |

Deploy: `npm run insforge:deploy:api`

---

## Not built yet

| Item | Doc reference |
|------|----------------|
| Real LLM translator (router + writers + Claude) | flow-b-v0, tech-stack |
| **Router LLM** | ✅ Phase 2 shipped — `action:route`; tune with `route-golden` |
| **Features writer LLM** | ✅ Phase 3 shipped — `action:write-features`; tune with `write-features-golden` |
| **Full intent pipeline on canvas chat** | ✅ `action:intent` wired — router + writers + validator + mapper |
| `/spec/*.md` export on commit | ✅ **Phase 6 shipped** — `exportedSpec` on `action:commit`; `npm run write:spec` |
| InsForge Sites / Cloudflare deploy | **[USER]** hosting choice |
| Auth | Out of v0 scope |
| Flow A repo import | flow-a-v0 (deferred) |
| Execution phase planner | execution-phases.md (future) |
| Flow C in-app execution | **[USER]** out of scope |
| DB seed from sample project on first load | ~~ai-inferred gap~~ — **superseded:** frontend loads repo `spec/*.md` via `specToCanvas` |
| DB columns for `layer` / `parent_card_id` on cards | layer model in frontend only for now |
| canvas.json export | planned in structured.md |

---

## Verification

```bash
npm run insforge:invoke:health
# → { "ok": true, "hasSecrets": true, "mode": "insforge" }

npm run dev
# Canvas + chat bar; no top header chrome
```

---

## Doc sync checklist (for agents)

After changing this file, also update if relevant:

- [ ] [insforge/README.md](../../insforge/README.md) — URLs, migrate, deploy
- [ ] [tech-stack.md](../product/tech-stack.md) — if stack locked items change
- [ ] [ai-inferred-decisions.md](../meta/ai-inferred-decisions.md) — new implementation choices
