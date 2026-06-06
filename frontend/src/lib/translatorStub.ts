import type { CanvasEdge, Card, PreviewPayload } from '../types/canvas'
import {
  buildStubPreviewPlan,
  mapCanvasToPreview,
} from '@nlide/shared/canvasMapper'

function finalizeStubMdPatches(
  preview: PreviewPayload,
  committedCardIds: Set<string>,
): PreviewPayload {
  const newOq = preview.cards.find(
    (card) => card.type === 'open-question' && !committedCardIds.has(card.id),
  )
  const featuresPatch = preview.mdPatches.find((patch) => patch.file === 'features.md')

  return {
    ...preview,
    mdPatches: [
      {
        file: 'open-questions.md',
        action: 'add',
        anchor: newOq?.specRef.anchor ?? newOq?.id ?? 'OQ-preview',
        summary: 'Add open question about allowed Google domains',
      },
      {
        file: 'features.md',
        action: 'add',
        anchor: featuresPatch?.anchor ?? 'F-004',
        summary: featuresPatch?.summary ?? 'Propose F-004 Google login feature',
      },
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
