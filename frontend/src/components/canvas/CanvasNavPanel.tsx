import { Panel } from '@xyflow/react'
import { useFullscreen } from '../../hooks/useFullscreen'
import type { CanvasViewMode } from '../../lib/canvasLayers'
import LayerStackIndicator from './LayerStackIndicator'

function FullscreenEnterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FullscreenExitIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 3v3a2 2 0 0 1-2 2H3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type LayerTransitionPhase = 'idle' | 'leaving' | 'entering'

interface CanvasNavPanelProps {
  mode: CanvasViewMode
  transitionPhase: LayerTransitionPhase
  hidden?: boolean
  onNavigateOverview?: () => void
}

export default function CanvasNavPanel({
  mode,
  transitionPhase,
  hidden = false,
  onNavigateOverview,
}: CanvasNavPanelProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  if (hidden) {
    return null
  }

  return (
    <Panel position="top-left" className="canvas-nav-panel">
      <div
        className="canvas-nav-panel__cluster canvas-nav-panel__cluster--layer"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="canvas-nav-panel__layer-section">
          <div className="canvas-nav-panel__layer-header">
            <span className="canvas-nav-panel__layer-title">View</span>
            <button
              type="button"
              className="canvas-nav-panel__icon-btn"
              onClick={() => void toggleFullscreen()}
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
            </button>
          </div>
          <LayerStackIndicator
            mode={mode}
            transitionPhase={transitionPhase}
            onSelectOverview={onNavigateOverview}
          />
        </div>
      </div>
    </Panel>
  )
}
