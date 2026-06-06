import { Handle, Position, type NodeProps } from '@xyflow/react'
import clsx from 'clsx'
import { type CSSProperties } from 'react'
import type { Card } from '../../../types/canvas'
import { cardJiggleDelay } from '../../../lib/canDeleteCard'
import {
  cardTypeLabel,
  cardTypeStyles,
  cardTypeLabelStyles,
  cardTypeHandleStyles,
  cardSelectedStyles,
} from '../../../lib/cardStyles'
import { useLongPress } from '../../../hooks/useLongPress'
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
  const isDeleteMode = useCanvasStore((state) => state.isDeleteMode)
  const toggleSelectCard = useCanvasStore((state) => state.toggleSelectCard)
  const drillTopLayerCard = useCanvasStore((state) => state.drillTopLayerCard)
  const enterDeleteMode = useCanvasStore((state) => state.enterDeleteMode)

  const longPress = useLongPress(enterDeleteMode, { disabled: isDeleteMode })

  return (
    <button
      type="button"
      style={
        isDeleteMode
          ? ({ '--card-jiggle-delay': `${cardJiggleDelay(card.id)}ms` } as CSSProperties)
          : undefined
      }
      onClick={(event) => {
        if (longPress.consumeClick()) return
        if (isDeleteMode) return
        if (event.detail === 2) return
        toggleSelectCard(card.id)
      }}
      onDoubleClick={(event) => {
        if (isDeleteMode) return
        event.stopPropagation()
        drillTopLayerCard(card.id)
      }}
      onPointerDown={longPress.onPointerDown}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onPointerCancel={longPress.onPointerCancel}
      className={clsx(
        'canvas-node-card w-[300px] rounded-3xl border px-4 py-3 text-left shadow-lg transition-[opacity,box-shadow,border-color,filter,transform,ring-color]',
        cardTypeStyles(card.type),
        isPreview && 'border-dashed opacity-80',
        isSelected && !isDeleteMode && cardSelectedStyles(card.type),
        isDeleteMode && 'canvas-node-card--jiggle',
      )}
    >
      {handlePositions.map((position) => (
        <Handle
          key={`target-${position}`}
          id={`target-${position}`}
          type="target"
          position={position}
          className={clsx('!h-1.5 !w-1.5', cardTypeHandleStyles(card.type))}
        />
      ))}
      {handlePositions.map((position) => (
        <Handle
          key={`source-${position}`}
          id={`source-${position}`}
          type="source"
          position={position}
          className={clsx('!h-1.5 !w-1.5', cardTypeHandleStyles(card.type))}
        />
      ))}
      <div
        className={clsx(
          'mb-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
          cardTypeLabelStyles(card.type),
        )}
      >
        {cardTypeLabel(card.type)}
      </div>
      <h2 className="mb-1 text-base font-semibold text-stone-900">{card.title}</h2>
      <p className="text-xs leading-relaxed text-stone-700">{card.body}</p>
      {card.vizType && card.vizPayload !== undefined && (
        <div className="mt-2">
          <VizEmbed vizType={card.vizType} payload={card.vizPayload} compact />
        </div>
      )}
    </button>
  )
}
