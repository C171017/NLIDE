import type { CanvasEdge, Card, PreviewPayload } from '../types/canvas'
import {
  buildStubPreviewPlan,
  mapCanvasToPreview,
} from '@nlide/shared/canvasMapper'

const F001_PAN_ZOOM_SECTION = `### F-001: Intent canvas

- **Status:** in_progress
- **Priority:** high
- **Description:** Users arrange cards on a pannable, zoomable canvas with links between intent nodes. Overview shows Product · Frontend · Backend pillars; drill into Frontend for implementation tasks.
- **Acceptance criteria:**
  - Canvas loads cards from \`spec/*.md\` on startup
  - Overview shows three pillars; detail cards appear when drilling a pillar
  - Users can pan the canvas with pointer drag
  - Users can zoom the canvas with scroll or pinch
  - Pan and zoom remain smooth while reading cards and edges
- **Related:** architecture.md (Canvas IA), tasks.md (T-001, T-008)`

function isPanZoomUpdateMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return lower.includes('canvas') && (lower.includes('pan') || lower.includes('zoom'))
}

function buildStubUpdateFeaturePreview(
  message: string,
  cards: Card[],
  edges: CanvasEdge[],
  centerCardId: string,
): PreviewPayload {
  const writerHints = [
    {
      entityId: 'F-001',
      file: 'features.md' as const,
      action: 'update' as const,
      title: 'Intent canvas',
      body: F001_PAN_ZOOM_SECTION,
      summary: 'Update F-001 acceptance criteria for pan/zoom',
    },
  ]

  const mdPatches = [
    {
      file: 'features.md',
      action: 'update' as const,
      anchor: 'F-001',
      summary: 'Update F-001 acceptance criteria for pan/zoom',
      section: F001_PAN_ZOOM_SECTION,
    },
  ]

  return mapCanvasToPreview({
    committedCards: cards,
    committedEdges: edges,
    centerCardId,
    routerPlan: {
      intent_type: 'update_feature',
      summary: 'Add pan and zoom acceptance criteria to F-001.',
      operations: [{ target: 'features.md', action: 'update', entity_id: 'F-001' }],
      canvas_ops: [],
      open_questions: [],
    },
    writerHints,
    mdPatches,
    userMessage: message,
  })
}

function finalizeStubMdPatches(
  preview: PreviewPayload,
  committedCardIds: Set<string>,
): PreviewPayload {
  const newOq = preview.cards.find(
    (card) => card.type === 'open-question' && !committedCardIds.has(card.id),
  )
  const featurePatches = preview.mdPatches.filter((patch) => patch.file === 'features.md')

  return {
    ...preview,
    mdPatches: [
      {
        file: 'open-questions.md',
        action: 'add',
        anchor: newOq?.specRef.anchor ?? newOq?.id ?? 'OQ-preview',
        summary: 'Add open question about allowed Google domains',
      },
      ...featurePatches.map((patch) => ({
        file: 'features.md',
        action: 'add' as const,
        anchor: patch.anchor,
        summary: patch.summary,
      })),
    ],
  }
}

/** Local fallback when InsForge function URL is not configured. */
export function buildPreviewLocal(
  message: string,
  cards: Card[],
  edges: CanvasEdge[],
  centerCardId = 'product',
): PreviewPayload {
  if (isPanZoomUpdateMessage(message)) {
    return buildStubUpdateFeaturePreview(message, cards, edges, centerCardId)
  }

  const committedCardIds = new Set(cards.map((card) => card.id))
  const preview = mapCanvasToPreview({
    committedCards: cards,
    committedEdges: edges,
    centerCardId,
    routerPlan: buildStubPreviewPlan(message),
    userMessage: message,
  })

  return finalizeStubMdPatches(preview, committedCardIds)
}
