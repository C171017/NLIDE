import type { FormEvent } from 'react'
import { useFullscreen } from '../../hooks/useFullscreen'
import { useCanvasStore } from '../../store/canvasStore'
import PreviewActions from './PreviewActions'

export default function ChatBar() {
  const chatDraft = useCanvasStore((state) => state.chatDraft)
  const setChatDraft = useCanvasStore((state) => state.setChatDraft)
  const submitChat = useCanvasStore((state) => state.submitChat)
  const isTranslating = useCanvasStore((state) => state.isTranslating)
  const preview = useCanvasStore((state) => state.preview)
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submitChat(chatDraft)
  }

  return (
    <footer className="glass-panel shrink-0 rounded-3xl px-4 py-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <textarea
            value={chatDraft}
            onChange={(event) => setChatDraft(event.target.value)}
            rows={2}
            placeholder='e.g. "Add Google login for enterprise users"'
            className="glass-surface w-full resize-none rounded-2xl px-3 py-2 text-sm text-[#e8eaed] outline-none focus:border-sky-400/60"
          />
        </label>
        <div className="flex shrink-0 flex-col gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="soft-button rounded-2xl px-4 py-2 text-sm text-[#d1d5db]"
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
          <button
            type="submit"
            disabled={isTranslating || !chatDraft.trim()}
            className="rounded-2xl border border-sky-300/20 bg-sky-500/80 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-950/30 transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTranslating ? 'Translating…' : 'Send'}
          </button>
        </div>
      </form>
      {preview && <PreviewActions />}
    </footer>
  )
}
