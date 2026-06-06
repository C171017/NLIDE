import { useCallback, useRef } from 'react'

interface LongPressHandlers {
  onPointerDown: (event: React.PointerEvent) => void
  onPointerUp: (event: React.PointerEvent) => void
  onPointerLeave: (event: React.PointerEvent) => void
  onPointerCancel: (event: React.PointerEvent) => void
  consumeClick: () => boolean
}

interface UseLongPressOptions {
  delayMs?: number
  moveThresholdPx?: number
  disabled?: boolean
}

export function useLongPress(
  onLongPress: () => void,
  { delayMs = 550, moveThresholdPx = 8, disabled = false }: UseLongPressOptions = {},
): LongPressHandlers {
  const timerRef = useRef<number | null>(null)
  const originRef = useRef<{ x: number; y: number } | null>(null)
  const didLongPressRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || event.button !== 0) return

      didLongPressRef.current = false
      originRef.current = { x: event.clientX, y: event.clientY }

      clearTimer()
      timerRef.current = window.setTimeout(() => {
        didLongPressRef.current = true
        onLongPress()
      }, delayMs)
    },
    [clearTimer, delayMs, disabled, onLongPress],
  )

  const cancelIfMoved = useCallback(
    (event: React.PointerEvent) => {
      const origin = originRef.current
      if (!origin || timerRef.current === null) return

      const dx = event.clientX - origin.x
      const dy = event.clientY - origin.y
      if (Math.hypot(dx, dy) > moveThresholdPx) {
        clearTimer()
      }
    },
    [clearTimer, moveThresholdPx],
  )

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      cancelIfMoved(event)
      clearTimer()
      originRef.current = null
    },
    [cancelIfMoved, clearTimer],
  )

  const onPointerLeave = useCallback(
    (event: React.PointerEvent) => {
      cancelIfMoved(event)
      clearTimer()
      originRef.current = null
    },
    [cancelIfMoved, clearTimer],
  )

  const onPointerCancel = useCallback(() => {
    clearTimer()
    originRef.current = null
  }, [clearTimer])

  const consumeClick = useCallback(() => {
    if (!didLongPressRef.current) return false
    didLongPressRef.current = false
    return true
  }, [])

  return {
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    consumeClick,
  }
}
