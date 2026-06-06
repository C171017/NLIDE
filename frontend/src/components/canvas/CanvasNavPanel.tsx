import { MiniMap, Panel } from '@xyflow/react'
import type { CanvasViewMode } from '../../lib/canvasLayers'
import LayerStackIndicator from './LayerStackIndicator'

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
          nodeColor={(node) => (node.type === 'index' ? '#f59e0b' : '#374151')}
          maskColor="rgba(15, 17, 23, 0.75)"
        />
      </div>
    </Panel>
  )
}
