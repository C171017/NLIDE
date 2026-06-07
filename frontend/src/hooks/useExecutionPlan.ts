import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildExecutionHandoffBundle,
  executionPlanToBuildPhases,
  isLegacyExecutionPlan,
  isPlanDisplayable,
  type ExecutionPlan,
  type ExecutionPlanPreviewPayload,
  type ExecutionPlanState,
  type ExecutionPlanValidationIssue,
} from '@nlide/shared'
import { useCanvasStore } from '../store/canvasStore'
import { useImplementationProgressStore } from '../store/implementationProgressStore'
import {
  commitExecutionPlanRemote,
  discardExecutionPlanRemote,
  ExecutionPlanApiError,
  fetchExecutionPlan,
  isInsForgeConfigured,
  regenerateExecutionPlan,
} from '../lib/api'
import { assembleExecutionPlanInput } from '../lib/assembleExecutionPlanInput'
import { downloadHandoffZip } from '../lib/downloadHandoffZip'
import { loadSpecProjectName } from '../lib/loadSpecCanvas'
import type { BuildPhase } from '@nlide/shared'

const LOCAL_COMMITTED_KEY = 'nlide-execution-plan-committed'
const LOCAL_PREVIEW_KEY = 'nlide-execution-plan-preview'

interface LocalCommittedPayload {
  plan: ExecutionPlan
  tasksMd?: string
}

function readLocalState(): ExecutionPlanState {
  try {
    const committedRaw = localStorage.getItem(LOCAL_COMMITTED_KEY)
    const previewRaw = localStorage.getItem(LOCAL_PREVIEW_KEY)

    let committed: ExecutionPlan | null = null
    let committedTasksMd: string | null = null

    if (committedRaw) {
      const parsed = JSON.parse(committedRaw) as ExecutionPlan | LocalCommittedPayload
      if (parsed && typeof parsed === 'object' && 'plan' in parsed) {
        committed = parsed.plan
        committedTasksMd = parsed.tasksMd ?? null
      } else {
        committed = parsed as ExecutionPlan
      }
    }

    return {
      committed,
      committedTasksMd,
      preview: previewRaw ? (JSON.parse(previewRaw) as ExecutionPlanPreviewPayload) : null,
    }
  } catch {
    return { committed: null, committedTasksMd: null, preview: null }
  }
}

function writeLocalCommitted(plan: ExecutionPlan | null, tasksMd?: string | null) {
  if (plan) {
    const payload: LocalCommittedPayload = { plan, tasksMd: tasksMd ?? undefined }
    localStorage.setItem(LOCAL_COMMITTED_KEY, JSON.stringify(payload))
  } else {
    localStorage.removeItem(LOCAL_COMMITTED_KEY)
  }
}

function writeLocalPreview(preview: ExecutionPlanPreviewPayload | null) {
  if (preview) {
    localStorage.setItem(LOCAL_PREVIEW_KEY, JSON.stringify(preview))
  } else {
    localStorage.removeItem(LOCAL_PREVIEW_KEY)
  }
}

function assembleTasksMd(cards: ReturnType<typeof useCanvasStore.getState>['committedCards']): string {
  const projectName = loadSpecProjectName()
  const { input } = assembleExecutionPlanInput(cards, projectName)
  return input.spec['tasks.md'] ?? ''
}

export type ExecutionSpecSource = 'postgres' | 'merged' | 'repo' | 'client' | 'local'

export interface ExecutionPlanErrorDetails {
  message: string
  issues: ExecutionPlanValidationIssue[]
  zodIssues: Array<{ path?: string; message: string }>
}

export function useExecutionPlan() {
  const committedCards = useCanvasStore((state) => state.committedCards)
  const completed = useImplementationProgressStore((state) => state.completed)
  const resetForPlan = useImplementationProgressStore((state) => state.resetForPlan)

  const [committedPlan, setCommittedPlan] = useState<ExecutionPlan | null>(null)
  const [committedTasksMd, setCommittedTasksMd] = useState<string | null>(null)
  const [previewPlan, setPreviewPlan] = useState<ExecutionPlanPreviewPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [error, setError] = useState<ExecutionPlanErrorDetails | null>(null)
  const [warnings, setWarnings] = useState<ExecutionPlanValidationIssue[]>([])
  const [specSource, setSpecSource] = useState<ExecutionSpecSource>('local')
  const [tasksMd, setTasksMd] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  const canonicalTasksMd = useMemo(
    () => assembleTasksMd(committedCards),
    [committedCards],
  )

  const applyLoadedState = useCallback(
    (state: ExecutionPlanState) => {
      setCommittedPlan(state.committed)
      setCommittedTasksMd(state.committedTasksMd ?? null)
      setPreviewPlan(state.preview)

      const loadedTasksMd =
        state.preview?.tasksMd ??
        state.committedTasksMd ??
        assembleTasksMd(committedCards)

      setTasksMd(loadedTasksMd)
      setWarnings([])

      if (state.preview?.tasksMd || state.committedTasksMd) {
        setSpecSource('client')
      }

      if (state.committed) {
        resetForPlan(state.committed.planVersion)
      }
    },
    [committedCards, resetForPlan],
  )

  const loadState = useCallback(async () => {
    setIsBootstrapping(true)
    setError(null)
    try {
      if (isInsForgeConfigured()) {
        const state = await fetchExecutionPlan()
        applyLoadedState(state)
      } else {
        applyLoadedState(readLocalState())
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to load execution plan',
        issues: [],
        zodIssues: [],
      })
    } finally {
      setIsBootstrapping(false)
    }
  }, [applyLoadedState])

  useEffect(() => {
    void loadState()
  }, [loadState])

  const activePlan = previewPlan?.plan ?? committedPlan

  const visibleActivePlan = useMemo(() => {
    if (error) return null
    if (!activePlan) return null
    if (isLegacyExecutionPlan(activePlan)) return null
    if (!isPlanDisplayable(activePlan, tasksMd)) return null
    return activePlan
  }, [error, activePlan, tasksMd])

  const planStale = Boolean(activePlan && isLegacyExecutionPlan(activePlan))

  const phases: BuildPhase[] = useMemo(() => {
    if (!visibleActivePlan) return []
    return executionPlanToBuildPhases(visibleActivePlan, tasksMd, {
      isItemDone: (checklistId, itemId) => completed[checklistId]?.[itemId] ?? false,
    })
  }, [visibleActivePlan, tasksMd, completed])

  const regenerate = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setWarnings([])

    const stalePreviewId = previewPlan?.previewId
    let attemptedTasksMd = ''

    try {
      const projectName = loadSpecProjectName()
      const { input, source } = assembleExecutionPlanInput(committedCards, projectName)
      attemptedTasksMd = input.spec['tasks.md'] ?? ''

      if (!isInsForgeConfigured()) {
        throw new Error(
          'VITE_INSFORGE_FUNCTION_URL is not set — execution plan requires nlide-api + OPENROUTER_API_KEY',
        )
      }

      const result = await regenerateExecutionPlan({
        specBundle: input.spec,
        cardSynthesis: input.synthesis,
        projectName,
      })

      setTasksMd(result.tasksMd)
      setWarnings(
        result.warnings.map((issue) => ({
          ruleId: issue.ruleId ?? 'missing_task',
          message: issue.message,
        })),
      )
      const preview: ExecutionPlanPreviewPayload = {
        previewId: result.previewId,
        plan: result.plan,
        tasksMd: result.tasksMd,
      }
      setPreviewPlan(preview)
      setSpecSource(result.specSource === 'client' ? 'client' : source)
    } catch (err) {
      setPreviewPlan(null)
      writeLocalPreview(null)

      if (stalePreviewId && isInsForgeConfigured()) {
        void discardExecutionPlanRemote(stalePreviewId).catch(() => {})
      }

      if (err instanceof ExecutionPlanApiError) {
        setError({
          message: err.message,
          issues: (err.issues ?? []).map((issue) => ({
            ruleId: issue.ruleId ?? 'error',
            message: issue.message,
          })),
          zodIssues: err.zodIssues ?? [],
        })
        setTasksMd(err.tasksMd ?? attemptedTasksMd)
      } else {
        setError({
          message: err instanceof Error ? err.message : 'Regenerate failed',
          issues: [],
          zodIssues: [],
        })
        setTasksMd(attemptedTasksMd || canonicalTasksMd)
      }
    } finally {
      setIsLoading(false)
    }
  }, [committedCards, previewPlan, canonicalTasksMd])

  const commit = useCallback(async () => {
    if (!previewPlan) return
    setIsLoading(true)
    setError(null)

    try {
      if (isInsForgeConfigured()) {
        const plan = await commitExecutionPlanRemote(previewPlan.previewId)
        setCommittedPlan(plan)
        setCommittedTasksMd(previewPlan.tasksMd ?? null)
        setPreviewPlan(null)
        setWarnings([])
        if (previewPlan.tasksMd) {
          setTasksMd(previewPlan.tasksMd)
        }
        resetForPlan(plan.planVersion)
      } else {
        setCommittedPlan(previewPlan.plan)
        setCommittedTasksMd(previewPlan.tasksMd ?? null)
        writeLocalCommitted(previewPlan.plan, previewPlan.tasksMd)
        setPreviewPlan(null)
        writeLocalPreview(null)
        setWarnings([])
        if (previewPlan.tasksMd) {
          setTasksMd(previewPlan.tasksMd)
        }
        resetForPlan(previewPlan.plan.planVersion)
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Commit failed',
        issues: [],
        zodIssues: [],
      })
    } finally {
      setIsLoading(false)
    }
  }, [previewPlan, resetForPlan])

  const discard = useCallback(async () => {
    if (!previewPlan) return
    setIsLoading(true)
    setError(null)

    try {
      if (isInsForgeConfigured()) {
        await discardExecutionPlanRemote(previewPlan.previewId)
      } else {
        writeLocalPreview(null)
      }
      setPreviewPlan(null)
      setWarnings([])
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Discard failed',
        issues: [],
        zodIssues: [],
      })
    } finally {
      setIsLoading(false)
    }
  }, [previewPlan])

  const exportHandoff = useCallback(async () => {
    if (!visibleActivePlan) return

    setIsExporting(true)
    setExportMessage(null)
    setError(null)

    try {
      const projectName = loadSpecProjectName()
      const { input, source } = assembleExecutionPlanInput(committedCards, projectName)
      const exportedAt = new Date().toISOString()
      const exportTasksMd = tasksMd || committedTasksMd || canonicalTasksMd
      const bundle = buildExecutionHandoffBundle({
        projectName,
        spec: input.spec,
        synthesis: input.synthesis,
        plan: visibleActivePlan,
        tasksMd: exportTasksMd,
        specSource: specSource === 'local' ? source : specSource,
        progress: completed,
        exportedAt,
      })

      await downloadHandoffZip(bundle, exportedAt)
      setExportMessage('Handoff bundle saved.')
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Export failed',
        issues: [],
        zodIssues: [],
      })
    } finally {
      setIsExporting(false)
    }
  }, [visibleActivePlan, committedCards, tasksMd, committedTasksMd, canonicalTasksMd, specSource, completed])

  return {
    phases,
    committedPlan,
    previewPlan,
    activePlan: visibleActivePlan,
    regenerate,
    commit,
    discard,
    exportHandoff,
    isLoading,
    isExporting,
    exportMessage,
    isBootstrapping,
    error,
    warnings,
    specSource,
    hasPlan: Boolean(visibleActivePlan),
    isPreview: Boolean(previewPlan && visibleActivePlan),
    planStale,
  }
}
