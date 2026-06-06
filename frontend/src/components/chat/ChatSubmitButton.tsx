import { useCanvasStore } from '../../store/canvasStore'

function InterpretIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M12 19V5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  )
}

export default function ChatSubmitButton() {
  const chatDraft = useCanvasStore((state) => state.chatDraft)
  const isTranslating = useCanvasStore((state) => state.isTranslating)
  const submitChat = useCanvasStore((state) => state.submitChat)
  const cancelChat = useCanvasStore((state) => state.cancelChat)

  const canInterpret = Boolean(chatDraft.trim())

  const handleClick = () => {
    if (isTranslating) {
      cancelChat()
      return
    }

    if (canInterpret) {
      void submitChat(chatDraft)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isTranslating && !canInterpret}
      className="chat-submit-btn"
      aria-label={isTranslating ? 'Stop interpretation' : 'Interpret intent'}
      title={isTranslating ? 'Stop' : 'Interpret'}
    >
      {isTranslating ? <StopIcon /> : <InterpretIcon />}
    </button>
  )
}
