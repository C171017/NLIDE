import { useCanvasStore } from '../../store/canvasStore'
import { isInsForgeConfigured } from '../../lib/api'

export default function Header() {
  const projectName = useCanvasStore((state) => state.projectName)
  const preview = useCanvasStore((state) => state.preview)
  const backendMode = isInsForgeConfigured() ? 'InsForge' : 'Local stub'

  return (
    <header className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-[#2d3348] bg-[#12151d] px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="truncate text-sm font-semibold text-[#f3f4f6]">{projectName}</span>
        <span className="hidden shrink-0 rounded-full bg-[#1a1d27] px-2 py-0.5 text-[10px] text-[#9aa3b2] sm:inline-flex">
          Intent canvas
        </span>
        <span className="rounded-full bg-[#1a1d27] px-2 py-0.5 text-[10px] text-[#9aa3b2]">
          {backendMode}
        </span>
        {preview && (
          <span className="hidden shrink-0 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-300 sm:inline-flex">
            Preview active
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-[#2d3348] px-2.5 py-1.5 text-xs text-[#d1d5db] hover:bg-[#1a1d27] sm:px-3"
        >
          Export spec
        </button>
        <button
          type="button"
          className="rounded-md border border-[#2d3348] px-2.5 py-1.5 text-xs text-[#d1d5db] hover:bg-[#1a1d27] sm:px-3"
        >
          Settings
        </button>
      </div>
    </header>
  )
}
