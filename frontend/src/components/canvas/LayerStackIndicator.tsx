import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
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

function stopCanvasPointer(event: MouseEvent | PointerEvent) {
  event.stopPropagation()
}

export default function LayerStackIndicator({
  mode,
  transitionPhase,
  onSelectOverview,
}: LayerStackIndicatorProps) {
  const currentLabel = LAYER_LABELS[mode]
  const canReturnToOverview = mode === 'detail' && !!onSelectOverview

  const sheets: LayerSheet[] = [
    { id: 'top', depth: 0 },
    { id: 'detail', depth: 1 },
  ]

  return (
    <div
      className={`layer-stack layer-stack--${mode} layer-stack--${transitionPhase}${canReturnToOverview ? ' layer-stack--can-return' : ''}`}
      aria-label={`Canvas layer: ${currentLabel}`}
    >
      <div className="layer-stack__stage">
        <div className="layer-stack__visual" aria-hidden>
          {sheets.map((sheet) => {
            const isActive = sheet.id === mode

            return (
              <div
                key={sheet.id}
                className={`layer-stack__sheet layer-stack__sheet--${sheet.id}${isActive ? ' layer-stack__sheet--active' : ''}`}
                style={{ '--layer-depth': sheet.depth } as CSSProperties}
              >
                <span
                  className={`layer-stack__sheet-label${isActive ? '' : ' layer-stack__sheet-label--inactive'}`}
                >
                  {LAYER_LABELS[sheet.id]}
                </span>
              </div>
            )
          })}
        </div>

        {canReturnToOverview && (
          <button
            type="button"
            className="layer-stack__return-hit"
            aria-label="Return to overview"
            onPointerDown={stopCanvasPointer}
            onClick={(event) => {
              stopCanvasPointer(event)
              onSelectOverview?.()
            }}
          />
        )}
      </div>
    </div>
  )
}
