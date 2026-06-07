# NLIDE Frontend

Intent canvas web app — React + Vite + React Flow.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- React Flow (`@xyflow/react`) + dagre auto-layout
- Zustand (canvas + preview state)
- TipTap (per-card editing)
- P0 viz: Mermaid, TanStack Table, force graph, markdown tables

## Development

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal (default `http://localhost:5173`).

## Layout

- **Header** — project name, export/settings placeholders
- **Canvas** — React Flow graph with Index hub and linked cards
- **Side panel** — TipTap card editor + preview diff summary
- **Chat bar** — batch translator input with per-card Commit / Discard preview actions

## Current state (v0 scaffold)

- Sample project loaded from `src/data/sampleProject.ts`
- Chat submit uses a **stub preview** (no backend yet)
- Manual card edits update Zustand state locally
- Preview ghost cards/edges shown with dashed styling

Next steps: wire InsForge `POST /intent` and `POST /commit`, Postgres persistence, `/spec` export.
