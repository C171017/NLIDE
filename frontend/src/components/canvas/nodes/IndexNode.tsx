import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import type { Card } from '../../../types/canvas'
import { cardTypeLabel, cardSelectedStyles } from '../../../lib/cardStyles'
import { useCanvasStore } from '../../../store/canvasStore'
import VizEmbed from '../../viz/VizEmbed'

export type IndexNodeData = {
  card: Card
  isPreview?: boolean
}

const handlePositions = [Position.Top, Position.Right, Position.Bottom, Position.Left]

export default function IndexNode({ data }: NodeProps) {
  const nodeData = data as IndexNodeData
  const { card, isPreview } = nodeData
  const isSelected = useCanvasStore((state) => state.selectedCardId === card.id)
  const toggleSelectCard = useCanvasStore((state) => state.toggleSelectCard)
  const drillTopLayerCard = useCanvasStore((state) => state.drillTopLayerCard)

  return (
    <button
      type="button"
      onClick={(event) => {
        if (event.detail === 2) return
        toggleSelectCard(card.id)
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        drillTopLayerCard(card.id)
      }}
      className={clsx(
        'canvas-node-card w-[300px] rounded-3xl border border-amber-300/40 bg-amber-400/14 px-4 py-3 text-left shadow-2xl shadow-black/25 backdrop-blur-xl transition-[opacity,box-shadow,border-color,filter,transform,ring-color]',
        isPreview && 'border-dashed opacity-80',
        isSelected && cardSelectedStyles(card.type),
      )}
    >
      {handlePositions.map((position) => (
        <Handle
          key={`target-${position}`}
          id={`target-${position}`}
          type="target"
          position={position}
          className="!h-1.5 !w-1.5 !bg-amber-400"
        />
      ))}
      {handlePositions.map((position) => (
        <Handle
          key={`source-${position}`}
          id={`source-${position}`}
          type="source"
          position={position}
          className="!h-1.5 !w-1.5 !bg-amber-400"
        />
      ))}
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">
        {cardTypeLabel(card.type)}
      </div>
      <h2 className="mb-1 text-base font-semibold text-amber-50">{card.title}</h2>
      <p className="text-xs leading-relaxed text-amber-100/80">{card.body}</p>
      {card.vizType && card.vizPayload !== undefined && (
        <div className="mt-2">
          <VizEmbed vizType={card.vizType} payload={card.vizPayload} compact />
        </div>
      )}
    </button>
  )
}
