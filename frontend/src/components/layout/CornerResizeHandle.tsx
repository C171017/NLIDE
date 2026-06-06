import { useEffect, useRef } from 'react'
import clsx from 'clsx'

type CornerResizeHandleProps = {
  onResize: (deltaX: number, deltaY: number) => void
  className?: string
  label?: string
}

export default function CornerResizeHandle({
  onResize,
  className,
  label = 'Resize panel',
}: CornerResizeHandleProps) {
  const dragging = useRef(false)
  const lastPosition = useRef({ x: 0, y: 0 })
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onResizeRef.current = onResize
  }, [onResize])

  useEffect(() => {
    const stopDragging = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.classList.remove('is-resizing', 'is-resizing-nwse')
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return
      event.preventDefault()
      const deltaX = event.clientX - lastPosition.current.x
      const deltaY = event.clientY - lastPosition.current.y
      if (deltaX !== 0 || deltaY !== 0) {
        lastPosition.current = { x: event.clientX, y: event.clientY }
        onResizeRef.current(deltaX, deltaY)
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
      stopDragging()
    }
  }, [])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragging.current = true
    lastPosition.current = { x: event.clientX, y: event.clientY }
    document.body.classList.add('is-resizing', 'is-resizing-nwse')
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <div
      role="separator"
      aria-label={label}
      onPointerDown={onPointerDown}
      className={clsx('resize-handle resize-handle--corner', className)}
    />
  )
}
