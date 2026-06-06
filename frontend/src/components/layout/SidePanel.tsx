import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import clsx from 'clsx'
import { useResizableSize } from '../../hooks/useResizableSize'
import { useCanvasStore } from '../../store/canvasStore'
import CardEditor from '../cards/CardEditor'
import BuildPhasesPanel from '../build/BuildPhasesPanel'
import ResizeHandle from './ResizeHandle'

type SideTab = 'build' | 'card'

const PREVIEW_SUMMARY_HEIGHT_KEY = 'nlide.layout.previewSummaryHeight'

type SidePanelProps = {
  style?: CSSProperties
}

export default function SidePanel({ style }: SidePanelProps) {
  const [manualTab, setManualTab] = useState<{
    selectedCardId: string | null
    tab: SideTab
  } | null>(null)
  const committedCards = useCanvasStore((state) => state.committedCards)
  const preview = useCanvasStore((state) => state.preview)
  const selectedCardId = useCanvasStore((state) => state.selectedCardId)
  const updateCard = useCanvasStore((state) => state.updateCard)

  const activeCards = preview?.cards ?? committedCards
  const tab =
    selectedCardId && manualTab?.selectedCardId !== selectedCardId
      ? 'card'
      : (manualTab?.tab ?? 'build')

  const selectedCard = useMemo(
    () => activeCards.find((card) => card.id === selectedCardId) ?? null,
    [activeCards, selectedCardId],
  )

  const previewSummaryHeight = useResizableSize({
    storageKey: PREVIEW_SUMMARY_HEIGHT_KEY,
    defaultSize: 160,
    min: 96,
    max: 320,
  })

  const selectTab = (nextTab: SideTab) => {
    setManualTab({ selectedCardId, tab: nextTab })
  }

  return (
    <aside
      className="glass-panel flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl"
      style={style}
    >
      <div className="flex border-b border-white/10">
        <SideTabButton active={tab === 'build'} onClick={() => selectTab('build')}>
          Build plan
        </SideTabButton>
        <SideTabButton active={tab === 'card'} onClick={() => selectTab('card')}>
          Card editor
        </SideTabButton>
      </div>

      {tab === 'build' ? (
        <BuildPhasesPanel />
      ) : (
        <>
          <div className="border-b border-white/10 px-4 py-2">
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
            <>
              <ResizeHandle
                direction="vertical"
                label="Resize preview summary height"
                className="hidden lg:flex"
                onResize={(delta) => previewSummaryHeight.applyDelta(-delta)}
              />
              <div
                className="hidden min-h-0 shrink-0 overflow-auto border-t border-white/10 p-4 lg:block"
                style={{ height: previewSummaryHeight.size }}
              >
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
            </>
          )}
        </>
      )}
    </aside>
  )
}

function SideTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex-1 px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-b-2 border-sky-400 text-[#f3f4f6]'
          : 'text-[#9aa3b2] hover:text-[#d1d5db]',
      )}
    >
      {children}
    </button>
  )
}
