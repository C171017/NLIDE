import type { CSSProperties } from 'react'
import type { CanvasViewMode } from '../../lib/canvasLayers'

type LayerTransitionPhase = 'idle' | 'leaving' | 'entering'

interface LayerStackIndicatorProps {
  mode: CanvasViewMode
  transitionPhase: LayerTransitionPhase
  onSelectOverview?: () => void
}

interface LayerSheet {
  id: CanvasViewMode
  depth: number
}

const LAYER_LABELS: Record<CanvasViewMode, string> = {
  top: 'Overview',
  detail: 'Detail',
}

export default function LayerStackIndicator({
  mode,
  transitionPhase,
  onSelectOverview,
}: LayerStackIndicatorProps) {
  const currentLabel = LAYER_LABELS[mode]

  const sheets: LayerSheet[] = [
    { id: 'top', depth: 0 },
    { id: 'detail', depth: 1 },
  ]

  return (
    <div
      className={`layer-stack layer-stack--${mode} layer-stack--${transitionPhase}`}
      aria-label={`Canvas layer: ${currentLabel}`}
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
              aria-label={`${LAYER_LABELS[sheet.id]}${isActive ? ' (current layer)' : ''}`}
              disabled={!canNavigate}
              onClick={canNavigate ? onSelectOverview : undefined}
              title={canNavigate ? 'Return to overview' : undefined}
            >
              {isActive ? (
                <span className="layer-stack__sheet-label" aria-live="polite">
                  {LAYER_LABELS[sheet.id]}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
