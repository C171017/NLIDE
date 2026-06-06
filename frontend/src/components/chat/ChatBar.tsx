import type { FormEvent } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import PreviewActions from './PreviewActions'

export default function ChatBar() {
  const chatDraft = useCanvasStore((state) => state.chatDraft)
  const setChatDraft = useCanvasStore((state) => state.setChatDraft)
  const submitChat = useCanvasStore((state) => state.submitChat)
  const isTranslating = useCanvasStore((state) => state.isTranslating)
  const preview = useCanvasStore((state) => state.preview)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submitChat(chatDraft)
  }

  return (
    <footer className="shrink-0 border-t border-[#2d3348] bg-[#12151d] px-4 py-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="mb-1 block text-xs text-[#9aa3b2]">
            Describe what you want — translator runs once and returns a preview.
          </span>
          <textarea
            value={chatDraft}
            onChange={(event) => setChatDraft(event.target.value)}
            rows={2}
            placeholder='e.g. "Add Google login for enterprise users"'
            className="w-full resize-none rounded-lg border border-[#2d3348] bg-[#141824] px-3 py-2 text-sm text-[#e8eaed] outline-none focus:border-sky-500/60"
          />
        </label>
        <button
          type="submit"
          disabled={isTranslating || !chatDraft.trim()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isTranslating ? 'Translating…' : 'Send'}
        </button>
      </form>
      {preview && <PreviewActions />}
    </footer>
  )
}
