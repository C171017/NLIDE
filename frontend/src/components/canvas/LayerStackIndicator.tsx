import type { CSSProperties } from 'react'
import type { CanvasViewMode } from '../../lib/canvasLayers'

type LayerTransitionPhase = 'idle' | 'leaving' | 'entering'

interface LayerStackIndicatorProps {
  mode: CanvasViewMode
  focusTitle: string | null
  transitionPhase: LayerTransitionPhase
  onSelectOverview?: () => void
}

interface LayerSheet {
  id: CanvasViewMode
  label: string
  depth: number
}

export default function LayerStackIndicator({
  mode,
  focusTitle,
  transitionPhase,
  onSelectOverview,
}: LayerStackIndicatorProps) {
  const sheets: LayerSheet[] = [
    { id: 'top', label: 'Overview', depth: 0 },
    { id: 'detail', label: focusTitle ?? 'Detail', depth: 1 },
  ]

  return (
    <div
      className={`layer-stack layer-stack--${mode} layer-stack--${transitionPhase}`}
      aria-label="Canvas layer stack"
    >
      <div className="layer-stack__stage">
        {sheets.map((sheet) => {
          const isActive = sheet.id === mode
          const canNavigate = sheet.id === 'top' && mode === 'detail' && onSelectOverview

          return (
            <button
              key={sheet.id}
              type="button"
              className={`layer-stack__sheet layer-stack__sheet--${sheet.id}${isActive ? ' layer-stack__sheet--active' : ''}`}
              style={{ '--layer-depth': sheet.depth } as CSSProperties}
              aria-current={isActive ? 'true' : undefined}
              aria-label={`${sheet.label}${isActive ? ' (current layer)' : ''}`}
              disabled={!canNavigate}
              onClick={canNavigate ? onSelectOverview : undefined}
              title={canNavigate ? 'Return to overview' : undefined}
            >
              <span className="layer-stack__sheet-label">{sheet.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
