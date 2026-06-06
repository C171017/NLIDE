import { MiniMap, Panel } from '@xyflow/react'
import { useResizableSize } from '../../hooks/useResizableSize'
import CornerResizeHandle from '../layout/CornerResizeHandle'
import type { CanvasViewMode } from '../../lib/canvasLayers'
import LayerStackIndicator from './LayerStackIndicator'

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
        <LayerStackIndicator
          mode={mode}
          transitionPhase={transitionPhase}
          onSelectOverview={onNavigateOverview}
        />
        <MiniMap
          className="canvas-nav-panel__minimap"
          style={{ width: minimapWidth.size, height: minimapHeight.size }}
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
    </Panel>
  )
}
