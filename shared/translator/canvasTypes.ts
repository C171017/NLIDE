/** Canvas model shared by mapper, frontend, and nlide-api. */

import type { CardType as PlacementCardType } from './canvasPlacementRules.ts'

export type CanvasCardType = PlacementCardType | 'index'

export type CanvasLayer = 0 | 1

export type CardStatus = 'proposed' | 'approved' | 'in_progress' | 'done'

export type VizType =
  | 'mermaid'
  | 'markdown-table'
  | 'force-graph'
  | 'data-table'
  | 'progress-checklist'

export interface SpecRef {
  file: string
  anchor?: string
}

export interface CanvasCard {
  id: string
  specRef: SpecRef
  type: CanvasCardType
  title: string
  body: string
  position: { x: number; y: number }
  layer: CanvasLayer
  parentCardId?: string
  vizType?: VizType
  vizPayload?: unknown
  status?: CardStatus
}

export interface CanvasEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface MdPatch {
  file: string
  action: 'add' | 'update' | 'remove'
  anchor?: string
  summary: string
  /** Full markdown section from writers — used on commit when present. */
  section?: string
}

export interface PreviewPayload {
  previewId: string
  cards: CanvasCard[]
  edges: CanvasEdge[]
  mdPatches: MdPatch[]
  summary: string
}
