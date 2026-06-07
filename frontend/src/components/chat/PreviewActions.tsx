import { useMemo } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import { resolvePreviewCardQueueIds } from '../../lib/previewFocus'

export default function PreviewActions() {
  const preview = useCanvasStore((state) => state.preview)
  const previewQueueIndex = useCanvasStore((state) => state.previewQueueIndex)
  const committedCards = useCanvasStore((state) => state.committedCards)
  const committedEdges = useCanvasStore((state) => state.committedEdges)
  const commitPreviewCard = useCanvasStore((state) => state.commitPreviewCard)
  const discardPreviewCard = useCanvasStore((state) => state.discardPreviewCard)

  const queueState = useMemo(() => {
    if (!preview) return null

    const queueIds = preview.previewCardIds?.length
      ? preview.previewCardIds
      : resolvePreviewCardQueueIds(preview, committedCards, committedEdges)
    const currentId = queueIds[previewQueueIndex] ?? queueIds.find((id) =>
      preview.cards.some((card) => card.id === id),
    )
    const currentCard = currentId
      ? preview.cards.find((card) => card.id === currentId) ?? null
      : null

    return {
      currentCard,
      currentIndex: currentId ? Math.max(queueIds.indexOf(currentId), 0) : previewQueueIndex,
      total: queueIds.length,
    }
  }, [committedCards, committedEdges, preview, previewQueueIndex])

  if (!preview) return null

  const cardLabel = queueState?.currentCard
    ? `Card ${queueState.currentIndex + 1} of ${queueState.total} — ${queueState.currentCard.title} (${queueState.currentCard.id})`
    : 'Spec changes pending'

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/90">
          Preview queue
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#d1d5db]">{cardLabel}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void discardPreviewCard()}
          className="soft-button rounded-xl px-3 py-2 text-xs font-medium text-[#d1d5db]"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => void commitPreviewCard()}
          className="rounded-xl border border-emerald-300/25 bg-emerald-500/85 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
        >
          Commit
        </button>
      </div>
    </div>
  )
}
