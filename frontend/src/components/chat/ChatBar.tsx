import type { CSSProperties, FormEvent } from 'react'
import { useFullscreen } from '../../hooks/useFullscreen'
import { useCanvasStore } from '../../store/canvasStore'
import PreviewActions from './PreviewActions'

type ChatBarProps = {
  style?: CSSProperties
}

export default function ChatBar({ style }: ChatBarProps) {
  const chatDraft = useCanvasStore((state) => state.chatDraft)
  const setChatDraft = useCanvasStore((state) => state.setChatDraft)
  const submitChat = useCanvasStore((state) => state.submitChat)
  const isTranslating = useCanvasStore((state) => state.isTranslating)
  const preview = useCanvasStore((state) => state.preview)
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const hasPreview = Boolean(preview)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submitChat(chatDraft)
  }

  return (
    <footer
      className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-3xl px-4 py-3"
      style={style}
    >
      <form
        onSubmit={handleSubmit}
        className={`grid min-h-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] ${hasPreview ? 'shrink-0' : 'flex-1'}`}
      >
        <label className="flex min-h-0 min-w-0 flex-col">
          <textarea
            value={chatDraft}
            onChange={(event) => setChatDraft(event.target.value)}
            placeholder='e.g. "Add Google login for enterprise users"'
            className="glass-surface h-full min-h-11 w-full resize-none rounded-2xl px-3 py-2 text-sm text-[#e8eaed] outline-none focus:border-sky-400/60"
          />
        </label>
        <div className="grid shrink-0 grid-cols-2 gap-2 self-start sm:w-32 sm:grid-cols-1">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="soft-button min-h-11 rounded-2xl px-4 py-2 text-sm text-[#d1d5db]"
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
          <button
            type="submit"
            disabled={isTranslating || !chatDraft.trim()}
            className="min-h-11 rounded-2xl border border-sky-300/20 bg-sky-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-950/30 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTranslating ? 'Translating…' : 'Send'}
          </button>
        </div>
      </form>
      {hasPreview && (
        <div className="min-h-0 flex-1 overflow-auto">
          <PreviewActions />
        </div>
      )}
    </footer>
  )
}
