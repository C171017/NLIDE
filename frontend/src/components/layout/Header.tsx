import { useCanvasStore } from '../../store/canvasStore'

export default function Header() {
  const projectName = useCanvasStore((state) => state.projectName)
  const preview = useCanvasStore((state) => state.preview)

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#2d3348] bg-[#12151d] px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-[#f3f4f6]">{projectName}</span>
        <span className="rounded-full bg-[#1a1d27] px-2 py-0.5 text-[10px] text-[#9aa3b2]">
          Intent canvas
        </span>
        {preview && (
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-300">
            Preview active
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-[#2d3348] px-3 py-1.5 text-xs text-[#d1d5db] hover:bg-[#1a1d27]"
        >
          Export spec
        </button>
        <button
          type="button"
          className="rounded-md border border-[#2d3348] px-3 py-1.5 text-xs text-[#d1d5db] hover:bg-[#1a1d27]"
        >
          Settings
        </button>
      </div>
    </header>
  )
}
