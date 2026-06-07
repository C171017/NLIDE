import { useMemo } from 'react'
import { diffPreview } from '@nlide/shared/diffPreview'
import { useCanvasStore } from '../../store/canvasStore'

export default function PreviewActions() {
  const preview = useCanvasStore((state) => state.preview)
  const committedCards = useCanvasStore((state) => state.committedCards)
  const committedEdges = useCanvasStore((state) => state.committedEdges)
  const commitPreview = useCanvasStore((state) => state.commitPreview)
  const discardPreview = useCanvasStore((state) => state.discardPreview)

  const previewCardCount = useMemo(() => {
    if (!preview) return 0
    return diffPreview(committedCards, committedEdges, preview.cards, preview.edges).previewCardIds
      .size
  }, [committedCards, committedEdges, preview])

  if (!preview) return null

  const cardLabel =
    previewCardCount === 0
      ? 'Spec changes pending'
      : previewCardCount === 1
        ? '1 card in preview'
        : `${previewCardCount} cards in preview`

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/90">
          Preview — commit or discard
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#d1d5db]">{cardLabel}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void discardPreview()}
          className="soft-button rounded-xl px-3 py-2 text-xs font-medium text-[#d1d5db]"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => void commitPreview()}
          className="rounded-xl border border-emerald-300/25 bg-emerald-500/85 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400"
        >
          Commit
        </button>
      </div>
    </div>
  )
}
