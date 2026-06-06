import { useCanvasStore } from '../../store/canvasStore'

export default function PreviewActions() {
  const preview = useCanvasStore((state) => state.preview)
  const commitPreview = useCanvasStore((state) => state.commitPreview)
  const discardPreview = useCanvasStore((state) => state.discardPreview)

  if (!preview) return null

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-sky-300/20 bg-sky-500/12 px-3 py-2 shadow-inner shadow-white/5 sm:flex-row sm:items-center sm:justify-between">
      <p className="min-w-0 text-sm text-sky-100">{preview.summary}</p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => void discardPreview()}
          className="soft-button rounded-xl px-3 py-1.5 text-xs text-[#d1d5db]"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={() => void commitPreview()}
          className="rounded-xl border border-emerald-300/20 bg-emerald-500/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400"
        >
          Commit
        </button>
      </div>
    </div>
  )
}
