import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

      toggleItem: (checklistId, itemId) =>
        set((state) => {
          const checklist = state.completed[checklistId] ?? {}
          return {
            completed: {
              ...state.completed,
              [checklistId]: {
                ...checklist,
                [itemId]: !checklist[itemId],
              },
            },
          }
        }),

      isItemDone: (checklistId, itemId) =>
        Boolean(get().completed[checklistId]?.[itemId]),

      countDone: (checklistId, itemIds) =>
        itemIds.filter((id) => get().isItemDone(checklistId, id)).length,
    }),
    { name: 'nlide-implementation-progress' },
  ),
)
