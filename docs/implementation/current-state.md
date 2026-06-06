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
| **Layered canvas** (overview ↔ detail via pillar click) | `canvasLayers.ts`, `layout.ts`, layer panel in `IntentCanvas.tsx` |
| Card nodes + Product hub | `CardNode.tsx`, `IndexNode.tsx` (center pillar styling) |
| Chat bar + preview actions | `ChatBar.tsx`, `PreviewActions.tsx` |
| TipTap card editor | `CardEditor.tsx` |
| Side panel | `SidePanel.tsx` — **Build plan** tab (phases + jobs) + Card editor tab |
| Translator spec (shared) | `shared/translator/` — intent types, routing rules, build phases |
| Backend translator module | `insforge/functions/nlide-api/translator/` |
| Build phases UI | `BuildPhasesPanel.tsx`, `PhaseJobList.tsx` |
| P0 viz embeds | Mermaid, markdown table, force graph, data table, **progress-checklist** |
| Step 1 progress card | `translator-step1` task card — interactive 6/6 checklist (`ProgressChecklistViz`) |
| Implementation progress store | `implementationProgressStore.ts` — persists checklist ticks in localStorage |
| Canvas state (Zustand) | `frontend/src/store/canvasStore.ts` |
| API client + local stub | `frontend/src/lib/api.ts`, `translatorStub.ts` |
| Sample demo canvas | `frontend/src/data/sampleProject.ts` — Product center, Frontend/Backend pillars, detail cards under each |

Run: `npm run dev` (from repo root)

---

## Built — backend `[AI-INFERRED]`

| Component | Path / notes |
|-----------|----------------|
| Edge function (bundled) | `insforge/functions/nlide-api/index.ts` |
| Translator | **Stub** `buildPreview()` — not yet Claude router/writers |
| DB access | `@insforge/sdk` in edge function |

### API actions (live)

| action | Status |
|--------|--------|
| `health` | ✅ Deployed |
| `intent` | ✅ Stub preview → saves to `previews` table |
| `commit` | ✅ Applies preview to `cards` / `canvas_edges` |
| `discard` | ✅ Deletes preview row |
| `patch-card` | ✅ Updates card in Postgres |
| `get-translator-spec` | ✅ Intent types, routing rules, build phases |
| `get-project` | ✅ Loads from DB (empty until commit seeds data) |

Deploy: `npm run insforge:deploy:api`

---

## Not built yet

| Item | Doc reference |
|------|----------------|
| Real LLM translator (router + writers + Claude) | flow-b-v0, tech-stack |
| `/spec/*.md` export on commit | **[USER]** hybrid storage |
| InsForge Sites / Cloudflare deploy | **[USER]** hosting choice |
| Auth | Out of v0 scope |
| Flow A repo import | flow-a-v0 (deferred) |
| Execution phase planner | execution-phases.md (future) |
| Flow C in-app execution | **[USER]** out of scope |
| DB seed from sample project on first load | ai-inferred gap |
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
