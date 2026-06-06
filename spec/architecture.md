# Architecture

## Overview

React web app with InsForge edge functions and Postgres; translator pipeline produces intent spec and exports markdown on commit.

## Frontend

React canvas UI, card editor, chat bar, resizable side panel, and visualization embeds — the human-facing intent surface.

## Backend

InsForge edge functions (`nlide-api`), Postgres for runtime state (cards, spec_sections, previews), translator pipeline, and spec export on commit.

## Components

- **Canvas UI** — linked cards, overview layout, human-readable editing
- **Translator API** — router → writers → validator → canvas mapper
- **Spec store** — Postgres runtime + markdown export on commit

## Relationships

- Canvas UI → Translator API: chat submit with full project context
- Translator API → Spec store: preview rows; commit writes cards and `/spec` export
- Canvas UI → Spec store: load cards from committed state; patch-card sync

## Canvas IA

- Overview layer: all intent cards visible — Product hub, Frontend/Backend pillars, features, tasks, architecture
- Spec markdown (`spec/*.md`) is SSOT for card content; positions auto-layout on load
