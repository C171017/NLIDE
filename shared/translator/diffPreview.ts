/**
 * Preview vs committed diff — Phase 5 · Job 3 implementation.
 * Ghost styling trigger: ids absent from committed snapshot.
 */

import type { CanvasCard, CanvasEdge } from './canvasTypes.ts'

export interface PreviewDiffResult {
  previewCardIds: Set<string>
  previewEdgeIds: Set<string>
}

export function diffPreview(
  committedCards: CanvasCard[],
  committedEdges: CanvasEdge[],
  previewCards: CanvasCard[],
  previewEdges: CanvasEdge[],
): PreviewDiffResult {
  const committedCardIds = new Set(committedCards.map((card) => card.id))
  const committedEdgeIds = new Set(committedEdges.map((edge) => edge.id))

  const previewCardIds = new Set(
    previewCards.filter((card) => !committedCardIds.has(card.id)).map((card) => card.id),
  )

  const previewEdgeIds = new Set(
    previewEdges.filter((edge) => !committedEdgeIds.has(edge.id)).map((edge) => edge.id),
  )

  return { previewCardIds, previewEdgeIds }
}
