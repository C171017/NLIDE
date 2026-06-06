import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import type { Card } from '../../types/canvas'
import { useSpecFileContent } from '../../hooks/useSpecFileContent'
import { cardTypeLabel } from '../../lib/cardStyles'
import { useCanvasStore } from '../../store/canvasStore'
import SpecFilePanel from './SpecFilePanel'
import VizEmbed from '../viz/VizEmbed'

interface CardEditorProps {
  card: Card
  onChange: (patch: Partial<Pick<Card, 'title' | 'body'>>) => void
}

export default function CardEditor({ card, onChange }: CardEditorProps) {
  const projectName = useCanvasStore((state) => state.projectName)
  const committedCards = useCanvasStore((state) => state.committedCards)
  const preview = useCanvasStore((state) => state.preview)
  const exportedSpecCache = useCanvasStore((state) => state.exportedSpecCache)
  const {
    committedSection,
    proposedSection,
    hasPreview,
    isLoading: isSpecFileLoading,
  } = useSpecFileContent(card.specRef.file, card.specRef.anchor, {
    committedCards,
    preview,
    projectName,
    exportedSpecCache,
  })
  const editor = useEditor({
    extensions: [StarterKit],
    content: `<p>${card.body}</p>`,
    onUpdate: ({ editor: currentEditor }) => {
      onChange({ body: currentEditor.getText() })
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = card.body
    if (editor.getText() !== next) {
      editor.commands.setContent(`<p>${next}</p>`)
    }
  }, [card.body, editor])

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#9aa3b2]">
          {cardTypeLabel(card.type)} · {card.specRef.file}
        </div>
        <input
          value={card.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="glass-surface w-full rounded-2xl px-3 py-2 text-sm font-semibold text-[#f3f4f6] outline-none focus:border-sky-400/60"
        />
      </div>

      <div className="glass-surface flex-1 overflow-auto rounded-2xl px-3 py-2">
        <EditorContent editor={editor} className="text-sm text-[#d1d5db]" />
      </div>

      {card.vizType && card.vizPayload !== undefined && (
        <div>
          <div className="mb-2 text-xs font-medium text-[#9aa3b2]">Visualization</div>
          <VizEmbed vizType={card.vizType} payload={card.vizPayload} />
        </div>
      )}

      <SpecFilePanel
        file={card.specRef.file}
        anchor={card.specRef.anchor}
        committedSection={committedSection}
        proposedSection={proposedSection}
        hasPreview={hasPreview}
        isLoading={isSpecFileLoading}
      />
    </div>
  )
}
