import { useCallback, useState } from 'react'

function readStoredSize(storageKey: string, defaultSize: number): number {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return defaultSize
    const parsed = Number.parseInt(stored, 10)
    return Number.isFinite(parsed) ? parsed : defaultSize
  } catch {
    return defaultSize
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function useResizableSize({
  storageKey,
  defaultSize,
  min,
  max,
}: {
  storageKey: string
  defaultSize: number
  min: number
  max: number
}) {
  const [size, setSizeState] = useState(() => readStoredSize(storageKey, defaultSize))

  const setSize = useCallback(
    (next: number) => {
      const clamped = clamp(next, min, max)
      setSizeState(clamped)
      try {
        localStorage.setItem(storageKey, String(clamped))
      } catch {
        // Ignore quota / private-mode errors.
      }
    },
    [max, min, storageKey],
  )

  const applyDelta = useCallback(
    (delta: number) => {
      setSizeState((prev) => {
        const clamped = clamp(prev + delta, min, max)
        try {
          localStorage.setItem(storageKey, String(clamped))
        } catch {
          // Ignore quota / private-mode errors.
        }
        return clamped
      })
    },
    [max, min, storageKey],
  )

  return { size, setSize, applyDelta }
}
