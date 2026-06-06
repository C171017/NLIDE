import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Jobs already satisfied — user approved or code shipped. */
export const DEFAULT_COMPLETED_JOBS: Record<string, Record<string, boolean>> = {
  'phase-0-preview-loop': {
    'preview-commit-ux': true,
  },
  'phase-1-router-contract': {
    'routing-policy': true,
  },
}

interface ImplementationProgressStore {
  completed: Record<string, Record<string, boolean>>
  toggleItem: (checklistId: string, itemId: string) => void
  isItemDone: (checklistId: string, itemId: string) => boolean
  countDone: (checklistId: string, itemIds: string[]) => number
}

export const useImplementationProgressStore = create<ImplementationProgressStore>()(
  persist(
    (set, get) => ({
      completed: {},

      toggleItem: (checklistId, itemId) => {
        const current = get().isItemDone(checklistId, itemId)
        set((state) => ({
          completed: {
            ...state.completed,
            [checklistId]: {
              ...(state.completed[checklistId] ?? {}),
              [itemId]: !current,
            },
          },
        }))
      },

      isItemDone: (checklistId, itemId) => {
        const stored = get().completed[checklistId]?.[itemId]
        if (stored !== undefined) return stored
        return DEFAULT_COMPLETED_JOBS[checklistId]?.[itemId] ?? false
      },

      countDone: (checklistId, itemIds) =>
        itemIds.filter((id) => get().isItemDone(checklistId, id)).length,
    }),
    { name: 'nlide-implementation-progress' },
  ),
)
