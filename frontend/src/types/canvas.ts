export type CardType =
  | 'index'
  | 'product'
  | 'users'
  | 'feature'
  | 'task'
  | 'architecture'
  | 'constraint'
  | 'decision'
  | 'open-question'

export type CardStatus = 'proposed' | 'approved' | 'in_progress' | 'done'

export type VizType = 'mermaid' | 'markdown-table' | 'force-graph' | 'data-table'

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
}

export interface PreviewPayload {
  previewId: string
  cards: Card[]
  edges: CanvasEdge[]
  mdPatches: MdPatch[]
  summary: string
}
