import clsx from 'clsx'
import type { BuildPhase } from '@nlide/shared'
import { getPhaseExecution } from '@nlide/shared'
import {
  countHumanExecutionDone,
  isHumanExecutionDone,
  useImplementationProgressStore,
} from '../../store/implementationProgressStore'
import JobCheckbox from './JobCheckbox'

interface PhaseExecutionPanelProps {
  phase: BuildPhase
  briefsReady: boolean
}

export default function PhaseExecutionPanel({ phase, briefsReady }: PhaseExecutionPanelProps) {
  const humanExecution = useImplementationProgressStore((state) => state.humanExecution)
  const toggleHumanExecution = useImplementationProgressStore((state) => state.toggleHumanExecution)

  if (!briefsReady) return null

  const config = getPhaseExecution(phase.checklistId)
  if (!config) return null

  const agentDone = config.agentShipped
  const humanTaskIds = config.humanTasks.map((task) => task.id)
  const humanDone = countHumanExecutionDone(humanExecution, phase.checklistId, humanTaskIds)
  const humanTotal = config.humanTasks.length

  return (
    <div
      className={clsx(
        'mt-2 grid grid-cols-2 gap-0 overflow-hidden rounded-lg border text-[11px] leading-snug',
        agentDone ? 'border-violet-500/35 bg-violet-500/5' : 'border-emerald-500/30 bg-emerald-500/5',
      )}
    >
      {/* Agent column */}
      <div
        className={clsx(
          'border-r px-2.5 py-2',
          agentDone ? 'border-violet-500/25' : 'border-emerald-500/20',
        )}
      >
        <p
          className={clsx(
            'mb-1.5 text-[10px] font-semibold uppercase tracking-wide',
            agentDone ? 'text-violet-300' : 'text-emerald-300',
          )}
        >
          Agent
        </p>
        <JobCheckbox
          checked={agentDone}
          readOnly
          variant="agent"
          onToggle={() => undefined}
          label={
            <span className={clsx('font-medium', agentDone ? 'text-violet-100' : 'text-emerald-100')}>
              {agentDone ? 'Done — shipped in repo' : 'Ready — run in Cursor'}
            </span>
          }
          detail={
            <span
              className={clsx(
                'mt-0.5 block text-[10px] leading-snug',
                agentDone ? 'text-violet-200/80' : 'text-emerald-200/80',
              )}
            >
              {phase.agentModeGoal}
            </span>
          }
        />
      </div>

      {/* Human column */}
      <div className="px-2.5 py-2">
        <p className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-amber-300">
          <span>You</span>
          {humanTotal > 0 && (
            <span className="font-normal normal-case tabular-nums text-amber-200/70">
              {humanDone}/{humanTotal}
            </span>
          )}
        </p>

        {config.humanTasks.length === 0 ? (
          <p className="text-[10px] text-[#6b7280]">
            {agentDone ? 'Nothing required yet.' : 'Waiting for Agent to ship code.'}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {config.humanTasks.map((task) => {
              const checked = isHumanExecutionDone(humanExecution, phase.checklistId, task.id)
              return (
                <li key={task.id}>
                  <JobCheckbox
                    checked={checked}
                    variant="human"
                    onToggle={() => toggleHumanExecution(phase.checklistId, task.id)}
                    label={task.label}
                    detail={
                      task.detail ? (
                        <span className="mt-0.5 block text-[10px] leading-snug text-[#6b7280]">
                          {task.detail}
                        </span>
                      ) : undefined
                    }
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
