import { useMemo } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import CardEditor from '../cards/CardEditor'

export default function SidePanel() {
  const committedCards = useCanvasStore((state) => state.committedCards)
  const preview = useCanvasStore((state) => state.preview)
  const selectedCardId = useCanvasStore((state) => state.selectedCardId)
  const updateCard = useCanvasStore((state) => state.updateCard)

  const activeCards = preview?.cards ?? committedCards

  const selectedCard = useMemo(
    () => activeCards.find((card) => card.id === selectedCardId) ?? null,
    [activeCards, selectedCardId],
  )

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-[#2d3348] bg-[#12151d]">
      <div className="border-b border-[#2d3348] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#f3f4f6]">Card editor</h2>
        <p className="text-xs text-[#9aa3b2]">Manual edits sync to underlying spec sections.</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {selectedCard ? (
          <CardEditor
            card={selectedCard}
            onChange={(patch) => updateCard(selectedCard.id, patch)}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-[#2d3348] px-4 py-8 text-center text-sm text-[#9aa3b2]">
            Select a card on the canvas to edit it.
          </div>
        )}
      </div>

      {preview && (
        <div className="border-t border-[#2d3348] p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa3b2]">
            Preview summary
          </h3>
          <p className="mb-3 text-sm text-[#d1d5db]">{preview.summary}</p>
          <ul className="space-y-1 text-xs text-[#9aa3b2]">
            {preview.mdPatches.map((patch) => (
              <li key={`${patch.file}-${patch.anchor ?? patch.summary}`}>
                {patch.action} · {patch.file} — {patch.summary}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
