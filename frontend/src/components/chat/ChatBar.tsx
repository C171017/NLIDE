import type { FormEvent, KeyboardEvent } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import ChatSubmitButton from './ChatSubmitButton'

export default function ChatBar() {
  const chatDraft = useCanvasStore((state) => state.chatDraft)
  const setChatDraft = useCanvasStore((state) => state.setChatDraft)
  const submitChat = useCanvasStore((state) => state.submitChat)
  const isTranslating = useCanvasStore((state) => state.isTranslating)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (isTranslating || !chatDraft.trim()) return
    void submitChat(chatDraft)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    if (isTranslating || !chatDraft.trim()) return
    void submitChat(chatDraft)
  }

  return (
    <div className="floating-chat">
      <form onSubmit={handleSubmit} className="floating-chat__shell">
        <textarea
          value={chatDraft}
          onChange={(event) => setChatDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder='e.g. "Add Google login for enterprise users"'
          className="floating-chat__input"
        />
        <div className="floating-chat__footer">
          <ChatSubmitButton />
        </div>
      </form>
    </div>
  )
}
