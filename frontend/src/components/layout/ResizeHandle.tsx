import { useEffect, useRef } from 'react'
import clsx from 'clsx'

type ResizeDirection = 'horizontal' | 'vertical'

type ResizeHandleProps = {
  direction: ResizeDirection
  onResize: (delta: number) => void
  className?: string
  label?: string
}

export default function ResizeHandle({
  direction,
  onResize,
  className,
  label = 'Resize panel',
}: ResizeHandleProps) {
  const dragging = useRef(false)
  const lastPosition = useRef(0)
  const onResizeRef = useRef(onResize)

  onResizeRef.current = onResize

  useEffect(() => {
    const cursorClass = direction === 'horizontal' ? 'is-resizing-x' : 'is-resizing-y'

    const stopDragging = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.classList.remove('is-resizing', cursorClass)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return
      const position = direction === 'horizontal' ? event.clientX : event.clientY
      const delta = position - lastPosition.current
      if (delta !== 0) {
        lastPosition.current = position
        onResizeRef.current(delta)
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
  }, [direction])

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragging.current = true
    lastPosition.current = direction === 'horizontal' ? event.clientX : event.clientY
    document.body.classList.add('is-resizing')
    document.body.classList.add(
      direction === 'horizontal' ? 'is-resizing-x' : 'is-resizing-y',
    )
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <div
      role="separator"
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      aria-label={label}
      onPointerDown={onPointerDown}
      className={clsx(
        'resize-handle shrink-0',
        direction === 'horizontal' ? 'resize-handle--horizontal' : 'resize-handle--vertical',
        className,
      )}
    />
  )
}
