import type { CardSynthesisBundle } from './cardSynthesis.ts'
import { extractEntityIds, parseTaskTitles } from './extractEntityIds.ts'
import {
  EXECUTION_PLAN_VERSION,
  type ExecutionPlan,
  type ExecutionPhase,
} from './executionPlanTypes.ts'

interface TaskMeta {
  id: string
  title: string
  pillar: string
}

function parseTasks(tasksMd: string): TaskMeta[] {
  const titles = parseTaskTitles(tasksMd)
  const ids = extractEntityIds(tasksMd, 'T')

  return ids.map((id) => {
    const section = tasksMd.split(`### ${id}:`)[1]?.split('### ')[0] ?? ''
    const pillarMatch = section.match(/\*\*Pillar:\*\*\s*(\w+)/)
    return {
      id,
      title: titles.get(id) ?? id,
      pillar: pillarMatch?.[1]?.toLowerCase() ?? 'mixed',
    }
  })
}

function groupByPillar(tasks: TaskMeta[]): Map<string, TaskMeta[]> {
  const groups = new Map<string, TaskMeta[]>()
  for (const task of tasks) {
    const key = task.pillar
    const list = groups.get(key) ?? []
    list.push(task)
    groups.set(key, list)
  }
  return groups
}

const PILLAR_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  mixed: 'Cross-cutting',
}

function taskTitleFromSynthesis(
  taskId: string,
  synthesis: CardSynthesisBundle | undefined,
  fallback: string,
): string {
  const entry = synthesis?.cards.find((c) => c.anchor === taskId || c.id === taskId)
  return entry?.title?.trim() || fallback
}

/** Deterministic stub when OPENROUTER_API_KEY is missing. */
export function buildExecutionPlanStub(
  spec: Record<string, string>,
  synthesis?: CardSynthesisBundle,
): ExecutionPlan {
  const tasksMd = spec['tasks.md'] ?? ''
  const tasks = parseTasks(tasksMd)
  const groups = groupByPillar(tasks)

  const phases: ExecutionPhase[] = []
  let order = 1

  for (const [pillar, pillarTasks] of groups) {
    if (pillarTasks.length === 0) continue
    const phaseId = `PHASE-${String(order).padStart(3, '0')}`
    const label = PILLAR_LABELS[pillar] ?? pillar
    phases.push({
      id: phaseId,
      order,
      title: `${label} work`,
      goal: `Complete ${pillarTasks.length} task(s) for ${label.toLowerCase()}`,
      taskIds: pillarTasks.map((t) => t.id),
      exitCriteria: pillarTasks.map(
        (t) =>
          `${taskTitleFromSynthesis(t.id, synthesis, t.title)} — done when criteria in tasks.md pass`,
      ),
    })
    order++
  }

  for (let i = 0; i < phases.length - 1; i++) {
    phases[i] = { ...phases[i], blocks: [phases[i + 1].id] }
  }

  return {
    version: EXECUTION_PLAN_VERSION,
    summary:
      tasks.length > 0
        ? `${phases.length} phase(s) grouping ${tasks.length} task(s) by pillar (stub planner).`
        : 'No tasks in spec — add tasks to tasks.md and regenerate.',
    rationale: synthesis?.cards.length
      ? `Stub planner: grouped tasks by Pillar; ${synthesis.cards.length} human-layer card(s) provided.`
      : 'Stub planner: grouped tasks by Pillar field from tasks.md.',
    phases,
    planVersion: crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
    model: 'stub',
  }
}
