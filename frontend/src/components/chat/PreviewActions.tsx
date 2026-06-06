import { useCanvasStore } from '../../store/canvasStore'

export default function PreviewActions() {
  const preview = useCanvasStore((state) => state.preview)
  const commitPreview = useCanvasStore((state) => state.commitPreview)
  const discardPreview = useCanvasStore((state) => state.discardPreview)

  if (!preview) return null

  return (
    <div className="mt-3 flex items-center justify-between rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2">
      <p className="text-sm text-sky-100">{preview.summary}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={discardPreview}
          className="rounded-md border border-[#2d3348] px-3 py-1.5 text-xs text-[#d1d5db] hover:bg-[#1a1d27]"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={commitPreview}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Commit
        </button>
      </div>
    </div>
  )
}
