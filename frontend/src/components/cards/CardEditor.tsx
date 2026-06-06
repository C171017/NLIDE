import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import type { Card } from '../../types/canvas'
import { cardTypeLabel } from '../../lib/cardStyles'
import VizEmbed from '../viz/VizEmbed'

interface CardEditorProps {
  card: Card
  onChange: (patch: Partial<Pick<Card, 'title' | 'body'>>) => void
}

export default function CardEditor({ card, onChange }: CardEditorProps) {
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
          className="w-full rounded-lg border border-[#2d3348] bg-[#141824] px-3 py-2 text-sm font-semibold text-[#f3f4f6] outline-none focus:border-sky-500/60"
        />
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-[#2d3348] bg-[#141824] px-3 py-2">
        <EditorContent editor={editor} className="text-sm text-[#d1d5db]" />
      </div>

      {card.vizType && card.vizPayload !== undefined && (
        <div>
          <div className="mb-2 text-xs font-medium text-[#9aa3b2]">Visualization</div>
          <VizEmbed vizType={card.vizType} payload={card.vizPayload} />
        </div>
      )}
    </div>
  )
}
