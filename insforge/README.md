# InsForge setup — NLIDE

Backend: Postgres + Edge Functions + Model Gateway (Claude later).  
Frontend calls `nlide-api` edge function.

**Doc maintenance:** when URLs, migrations, or deploy steps change, also update [docs/implementation/current-state.md](../docs/implementation/current-state.md) per [docs/meta/documentation-guide.md](../docs/meta/documentation-guide.md).

## Project status (this repo)

- **InsForge project:** NLIDE (`c23614f7-c822-460e-a84b-86363965b78c`)
- **Dashboard:** https://insforge.dev/dashboard/project/c23614f7-c822-460e-a84b-86363965b78c
- **Function URL:** `https://4yqeeuk9.us-east.insforge.app/functions/nlide-api`
- **Linked:** `.insforge/project.json` (local, gitignored)

## 1. Install root dependencies

```bash
cd /Users/17c1710/Project/NLIDEroot/NLIDE
npm install
```

## 2. Log in and link project

```bash
npm run insforge:login
npm run insforge:link
```

`link` creates `.insforge/project.json` (gitignored). Pick or create a project in the browser flow.

## 3. Apply database migration

```bash
npm run insforge:migrate
```

Creates tables: `projects`, `cards`, `canvas_edges`, `spec_sections`, `previews`.  
Migration SQL: `migrations/20260606180626_nlide-schema.sql`

## 4. Edge function secrets

Reserved secrets (`INSFORGE_BASE_URL`, `ANON_KEY`) are **auto-provisioned** on project create. Verify:

```bash
insforge secrets list
```

## 5. Deploy API function

```bash
npm run insforge:deploy:api
```

Function source: `insforge/functions/nlide-api/` (imports `shared/translator/`). Run `npm run sync:translator` before deploy.

Public URL pattern: `https://{appkey}.{region}.insforge.app/functions/nlide-api`

## 6. Smoke test

```bash
npm run insforge:invoke:health
```

Expected: `{ "ok": true, "service": "nlide-api", "hasSecrets": true }`

Test translator spec:

```bash
insforge functions invoke nlide-api --data '{"action":"get-translator-spec"}'
```

Returns intent types, routing rules, and build phases from `shared/translator/`.

Test intent (after migrate):

```bash
insforge functions invoke nlide-api --data '{
  "action": "intent",
  "projectId": "00000000-0000-4000-8000-000000000001",
  "message": "Add Google login",
  "context": { "cards": [], "edges": [], "centerCardId": "index" }
}'
```

### Router smoke (`action:route`) — after Agent mode ships routeIntent()

Router-only classify (no preview write). Canonical brief: `shared/translator/routerSmokeInvoke.ts`.

Quick smoke (golden #1 — pan/zoom → `update_feature`):

```bash
npm run insforge:invoke:route-smoke
```

Or full payload:

```bash
insforge functions invoke nlide-api --data '{
  "action": "route",
  "message": "Users should be able to pan and zoom the canvas.",
  "context": {
    "projectName": "NLIDE Demo",
    "centerCardId": "product",
    "cards": [{
      "id": "F-001",
      "type": "feature",
      "title": "Canvas interaction",
      "body": "Pan, zoom, and navigate the intent canvas.",
      "specRef": { "file": "features.md", "anchor": "F-001" },
      "status": "approved"
    }],
    "edges": []
  }
}'
```

**Expected success:** `{ "ok": true, "plan": { "intent_type": "update_feature", ... } }`  
**Expected failures:** `router_invalid_json` (502), `router_validation_failed` (422) — see `routerFailureBehavior.ts`.

Additional examples (noop, clarify): see `ROUTER_SMOKE_EXAMPLES` in `shared/translator/routerSmokeInvoke.ts`.  
Golden batch: run all 10 fixture messages; need ≥8/10 pass before replacing stub.

## 7. Wire frontend

`frontend/.env.local` is already configured for this project:

```
VITE_INSFORGE_FUNCTION_URL=https://4yqeeuk9.us-east.insforge.app/functions/nlide-api
```

```bash
npm run dev
```

Without `.env.local`, the app uses a **local stub translator** (same preview behavior, no InsForge).

## 8. Deploy frontend (InsForge Sites)

```bash
cd frontend && npm run build
cd ..
insforge deployments create --name nlide-web --dir frontend/dist
```

**Fallback:** Cloudflare Pages → build `frontend/dist`, point your custom domain. Keep Edge Functions on InsForge.

## API actions

| action | Description |
|--------|-------------|
| `health` | Liveness + secrets check |
| `get-translator-spec` | Intent types, routing rules, build phases, golden prompts |
| `get-project` | Load cards/edges from Postgres |
| `route` | Router-only classify → `RouterPlan` JSON (**planned** — Phase 2 Agent mode) |
| `intent` | Chat → preview (stored in `previews`) |
| `commit` | Apply preview to `cards` / `canvas_edges` |
| `discard` | Delete preview row |
| `patch-card` | Manual card edit sync |

## Next steps

- Replace stub `buildPreview()` in `nlide-api/index.ts` with router + writers using Model Gateway (Claude Sonnet)
- Seed default project cards on first load
- Export `/spec/*.md` on commit
