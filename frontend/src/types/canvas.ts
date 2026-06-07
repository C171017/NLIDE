export type CardType =
  | 'index'
  | 'product'
  | 'frontend'
  | 'backend'
  | 'users'
  | 'feature'
  | 'task'
  | 'architecture'
  | 'constraint'
  | 'decision'
  | 'open-question'

export type CanvasLayer = 0 | 1

export type CardStatus = 'proposed' | 'approved' | 'in_progress' | 'done'

export type VizType =
  | 'mermaid'
  | 'markdown-table'
  | 'force-graph'
  | 'data-table'
  | 'progress-checklist'

export interface ProgressChecklistItem {
  id: string
  label: string
  detail?: string
}

export interface ProgressChecklistPayload {
  checklistId: string
  phaseLabel: string
  readyLabel: string
  blockedLabel: string
  items: ProgressChecklistItem[]
}

export interface SpecRef {
  file: string
  anchor?: string
}

export interface Card {
  id: string
  specRef: SpecRef
  type: CardType
  title: string
  body: string
  position: { x: number; y: number }
  /** 0 = top overview (Product · Frontend · Backend); 1 = detail under a top card */
  layer: CanvasLayer
  /** Required for layer 1 — which top-layer card owns this detail card */
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

export interface CanvasState {
  cards: Card[]
  edges: CanvasEdge[]
  centerCardId: string
}

export interface MdPatch {
  file: string
  action: 'add' | 'update' | 'remove'
  anchor?: string
  summary: string
  section?: string
}

export interface PreviewPayload {
  previewId: string
  cards: Card[]
  edges: CanvasEdge[]
  mdPatches: MdPatch[]
  summary: string
  /** Ordered card review queue. New/create ops keep router order; remaining diffs append in canvas order. */
  previewCardIds?: string[]
  /** Last create_card in this preview — canvas focus for compound turns. */
  focusCardId?: string | null
}
