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
  const moveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const removeMoveListener = useCallback(() => {
    if (moveHandlerRef.current) {
      window.removeEventListener('pointermove', moveHandlerRef.current)
      moveHandlerRef.current = null
    }
  }, [])

  const cancelIfMoved = useCallback(
    (clientX: number, clientY: number) => {
      const origin = originRef.current
      if (!origin || timerRef.current === null) return

      const dx = clientX - origin.x
      const dy = clientY - origin.y
      if (Math.hypot(dx, dy) > moveThresholdPx) {
        clearTimer()
      }
    },
    [clearTimer, moveThresholdPx],
  )

  const finishPress = useCallback(() => {
    removeMoveListener()
    clearTimer()
    originRef.current = null
  }, [clearTimer, removeMoveListener])

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled || event.button !== 0) return

      didLongPressRef.current = false
      originRef.current = { x: event.clientX, y: event.clientY }

      finishPress()

      const handlePointerMove = (moveEvent: PointerEvent) => {
        cancelIfMoved(moveEvent.clientX, moveEvent.clientY)
      }
      moveHandlerRef.current = handlePointerMove
      window.addEventListener('pointermove', handlePointerMove)

      timerRef.current = window.setTimeout(() => {
        didLongPressRef.current = true
        removeMoveListener()
        onLongPress()
      }, delayMs)
    },
    [cancelIfMoved, delayMs, disabled, finishPress, onLongPress, removeMoveListener],
  )

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      cancelIfMoved(event.clientX, event.clientY)
      finishPress()
    },
    [cancelIfMoved, finishPress],
  )

  const onPointerLeave = useCallback(
    (event: React.PointerEvent) => {
      cancelIfMoved(event.clientX, event.clientY)
      finishPress()
    },
    [cancelIfMoved, finishPress],
  )

  const onPointerCancel = useCallback(() => {
    finishPress()
  }, [finishPress])

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
