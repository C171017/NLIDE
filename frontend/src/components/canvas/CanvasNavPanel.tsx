import { MiniMap, Panel } from '@xyflow/react'
import { useResizableSize } from '../../hooks/useResizableSize'
import { useFullscreen } from '../../hooks/useFullscreen'
import CornerResizeHandle from '../layout/CornerResizeHandle'
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

const MINIMAP_WIDTH_KEY = 'nlide.layout.minimapWidth'
const MINIMAP_HEIGHT_KEY = 'nlide.layout.minimapHeight'

type LayerTransitionPhase = 'idle' | 'leaving' | 'entering'

interface CanvasNavPanelProps {
  mode: CanvasViewMode
  transitionPhase: LayerTransitionPhase
  onNavigateOverview?: () => void
}

export default function CanvasNavPanel({
  mode,
  transitionPhase,
  onNavigateOverview,
}: CanvasNavPanelProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const minimapWidth = useResizableSize({
    storageKey: MINIMAP_WIDTH_KEY,
    defaultSize: 200,
    min: 120,
    max: 480,
  })

  const minimapHeight = useResizableSize({
    storageKey: MINIMAP_HEIGHT_KEY,
    defaultSize: 150,
    min: 90,
    max: 360,
  })

  return (
    <Panel position="top-left" className="canvas-nav-panel">
      <div className="canvas-nav-panel__cluster">
        <div className="canvas-nav-panel__layer-section">
          <div className="canvas-nav-panel__layer-actions">
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
        <div
          className="canvas-nav-panel__minimap-section"
          style={{ width: minimapWidth.size, height: minimapHeight.size }}
        >
          <MiniMap
            className="canvas-nav-panel__minimap"
            nodeColor={(node) => (node.type === 'index' ? '#f59e0b' : '#374151')}
            maskColor="rgba(15, 17, 23, 0.75)"
          />
          <CornerResizeHandle
            label="Resize minimap"
            onResize={(deltaX, deltaY) => {
              minimapWidth.applyDelta(deltaX)
              minimapHeight.applyDelta(deltaY)
            }}
          />
        </div>
      </div>
    </Panel>
  )
}
