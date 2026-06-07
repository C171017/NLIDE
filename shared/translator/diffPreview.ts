/**
 * Preview vs committed diff — Phase 5 · Job 3 implementation.
 * Ghost styling trigger: new ids + in-place content changes while preview is active.
 */

import type { CanvasCard, CanvasEdge } from './canvasTypes.ts'

export interface PreviewDiffResult {
  previewCardIds: Set<string>
  previewEdgeIds: Set<string>
}

function cardHasPreviewDelta(committed: CanvasCard, preview: CanvasCard): boolean {
  if (committed.title !== preview.title) return true
  if (committed.body !== preview.body) return true
  if (committed.status !== preview.status) return true
  if (JSON.stringify(committed.vizPayload) !== JSON.stringify(preview.vizPayload)) {
    return true
  }
  return false
}

export function diffPreview(
  committedCards: CanvasCard[],
  committedEdges: CanvasEdge[],
  previewCards: CanvasCard[],
  previewEdges: CanvasEdge[],
): PreviewDiffResult {
  const committedCardIds = new Set(committedCards.map((card) => card.id))
  const committedEdgeIds = new Set(committedEdges.map((edge) => edge.id))
  const committedById = new Map(committedCards.map((card) => [card.id, card]))

  const previewCardIds = new Set<string>()

  for (const card of previewCards) {
    if (!committedCardIds.has(card.id)) {
      previewCardIds.add(card.id)
      continue
    }

    const committed = committedById.get(card.id)
    if (committed && cardHasPreviewDelta(committed, card)) {
      previewCardIds.add(card.id)
    }
  }

  const previewEdgeIds = new Set(
    previewEdges.filter((edge) => !committedEdgeIds.has(edge.id)).map((edge) => edge.id),
  )

  return { previewCardIds, previewEdgeIds }
}
