# Architecture

## Overview

React web app with InsForge edge functions and Postgres; translator pipeline produces intent spec and exports markdown on commit.

## Frontend

React canvas UI, card editor, chat bar, resizable side panel, and visualization embeds — the human-facing intent surface.

### Shell & layout

- **AppShell** — canvas + side panel split; dark chrome around milky paper canvas
- **ResizeHandle** — drag borders; sizes in `localStorage` (`nlide.layout.*`)
- **SidePanel** — Build plan tab + Card editor tab; preview summary + PreviewActions

### Canvas surface

- **IntentCanvas** — React Flow graph; floating ChatBar; layer drill transitions
- **CardNode / IndexNode** — typed cards with status chip and optional viz embed
- **LabeledEdge** — relationship labels between cards
- **CanvasNavPanel / LayerStackIndicator** — overview return + fullscreen
- **DeleteModeTrash** — long-press delete mode with trash drop target

### State & data

- **canvasStore** (Zustand) — committed canvas, preview, drill focus, chat, delete mode
- **loadSpecCanvas** — `spec/*.md` → `buildCanvasFromSpec()` on startup
- **layout.ts / canvasLayers.ts** — pillar layout, detail ring, visibility filtering
- **cardStyles.ts** — per-type border tint and selection ring colors

### Visualizations

- **VizEmbed** — Mermaid, TanStack data table, markdown table, force graph, progress checklist

### Chat & editing

- **ChatBar / ChatSubmitButton** — natural language input → translator
- **CardEditor / SpecFilePanel** — TipTap edit + assembled spec markdown preview
- **BuildPhasesPanel** — translator phase jobs with local progress store

## Backend

InsForge edge functions (`nlide-api`), Postgres for runtime state (cards, spec_sections, previews), translator pipeline, and spec export on commit.

## Components

- **Canvas UI** — linked cards, layered overview/detail, human-readable editing
- **Translator API** — router → writers → validator → canvas mapper
- **Spec store** — Postgres runtime + markdown export on commit

## Relationships

- Canvas UI → Translator API: chat submit with full project context
- Translator API → Spec store: preview rows; commit writes cards and `/spec` export
- Canvas UI → Spec store: load cards from committed state; patch-card sync

## Canvas IA

- Overview layer (layer 0): Product hub center, Frontend left, Backend right
- Detail layer (layer 1): cards under a pillar via `parentCardId` — features under Product, frontend tasks under Frontend, architecture/decisions under Backend
- Spec markdown (`spec/*.md`) is SSOT for card content; positions auto-layout on load
