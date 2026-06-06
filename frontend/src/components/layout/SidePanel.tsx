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
    <aside className="glass-panel flex max-h-[30vh] min-h-36 w-full shrink flex-col overflow-hidden rounded-3xl lg:max-h-none lg:min-h-0 lg:w-80 lg:shrink-0">
      <div className="border-b border-white/10 px-4 py-3">
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
          <div className="glass-surface rounded-2xl border-dashed px-4 py-8 text-center text-sm text-[#9aa3b2]">
            Select a card on the canvas to edit it.
          </div>
        )}
      </div>

      {preview && (
        <div className="hidden border-t border-white/10 p-4 lg:block">
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
