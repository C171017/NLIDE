/** Execution handoff bundle — spec + synthesis + phased agent briefs for Flow C export. */

import type { CardSynthesisBundle } from './cardSynthesis.ts'
import { parseTaskTitles } from './extractEntityIds.ts'
import { SPEC_FILE_ALLOWLIST } from './intentTypes.ts'
import type { ExecutionChecklistItem, ExecutionPhase, ExecutionPlan } from './executionPlanTypes.ts'
import { isLegacyExecutionPhase } from './executionPlanTypes.ts'

export interface ExecutionHandoffInput {
  projectName: string
  spec: Record<string, string>
  synthesis: CardSynthesisBundle
  plan: ExecutionPlan
  tasksMd: string
  specSource: string
  progress?: Record<string, Record<string, boolean>>
  exportedAt?: string
}

export interface ExecutionHandoffManifest {
  version: 'v1'
  exportedAt: string
  projectName: string
  specSource: string
  planVersion: string
  planSummary: string
  planSchemaVersion: string
  phaseCount: number
  taskIds: string[]
  specFiles: string[]
}

/** Slice a single ### T-xxx section from tasks.md (heading through next ### or EOF). */
export function extractTaskSection(tasksMd: string, taskId: string): string | null {
  const pattern = new RegExp(`(### ${taskId}:[\\s\\S]*?)(?=\\n### T-\\d{3}:|$)`)
  const match = tasksMd.match(pattern)
  return match ? match[1].trim() : null
}

function handoffDateStamp(iso: string): string {
  return iso.slice(0, 10)
}

function sortedPhases(plan: ExecutionPlan): ExecutionPhase[] {
  return [...plan.phases].sort((a, b) => a.order - b.order)
}

function resolvePhaseTaskIds(phase: ExecutionPhase): string[] {
  if (phase.taskIds?.length) return phase.taskIds
  return phase.relatedTaskIds ?? []
}

function formatChecklistItems(items: ExecutionChecklistItem[]): string {
  return items
    .map((item, index) => {
      const kind = item.kind ? ` (${item.kind})` : ''
      const detail = item.detail ? `\n   ${item.detail}` : ''
      return `${index + 1}. **${item.id}** — ${item.label}${kind}${detail}`
    })
    .join('\n')
}

export function formatSynthesisMarkdown(
  bundle: CardSynthesisBundle,
  projectName: string,
): string {
  const lines = [
    '# Canvas synthesis (human layer)',
    '',
    `Project: **${projectName}**`,
    '',
    'Plain-language card titles and bodies from the intent canvas. Use alongside `spec/` for intent; `spec/` is canonical for task IDs and acceptance criteria.',
    '',
    '## Files',
    '',
  ]

  for (const file of SPEC_FILE_ALLOWLIST) {
    if (file === 'INDEX.md') continue
    const count = bundle.byFile[file]?.length ?? 0
    if (count > 0) {
      lines.push(`- [${file}](./${file.replace('.md', '')}.md) — ${count} card(s)`)
    }
  }

  return lines.join('\n')
}

export function formatSynthesisFileMarkdown(
  file: string,
  entries: CardSynthesisBundle['cards'],
): string {
  const fileEntries = entries.filter((e) => e.file === file)
  const lines = [`# ${file} — canvas synthesis`, '']

  if (fileEntries.length === 0) {
    lines.push('_No canvas cards mapped to this file._')
    return lines.join('\n')
  }

  for (const entry of fileEntries) {
    lines.push(`## ${entry.id}${entry.anchor ? ` (${entry.anchor})` : ''}`)
    lines.push('')
    lines.push(`- **Type:** ${entry.type}`)
    if (entry.status) lines.push(`- **Status:** ${entry.status}`)
    lines.push('')
    lines.push(`### ${entry.title}`)
    lines.push('')
    lines.push(entry.body || '_Empty body_')
    lines.push('')
  }

  return lines.join('\n')
}

export function formatExecutionPlanOverview(plan: ExecutionPlan, tasksMd: string): string {
  const titles = parseTaskTitles(tasksMd)
  const phases = sortedPhases(plan)
  const lines = [
    '# Execution plan overview',
    '',
    plan.summary,
    '',
    `Plan schema: **${plan.version}**`,
    '',
  ]

  if (plan.rationale?.trim()) {
    lines.push('## Rationale', '', plan.rationale.trim(), '')
  }

  lines.push('## Phases', '')

  if (isLegacyExecutionPlan(plan)) {
    lines.push('| Phase | Goal | Tasks |')
    lines.push('|-------|------|-------|')
    for (const phase of phases) {
      const taskIds = resolvePhaseTaskIds(phase)
      const taskLabels = taskIds.map((id) => `${id}: ${titles.get(id) ?? id}`).join('; ')
      lines.push(`| ${phase.title} | ${phase.goal} | ${taskLabels} |`)
    }
  } else {
    lines.push('| Phase | Goal | Agent items | User gate items |')
    lines.push('|-------|------|-------------|-----------------|')
    for (const phase of phases) {
      lines.push(
        `| ${phase.title} | ${phase.goal} | ${phase.agentChecklist.length} | ${phase.userChecklist.length} |`,
      )
    }
  }

  lines.push('')
  return lines.join('\n')
}

function isLegacyExecutionPlan(plan: ExecutionPlan): boolean {
  return plan.version === 'v1' || plan.phases.every((p) => isLegacyExecutionPhase(p))
}

function appendTaskSections(lines: string[], tasksMd: string, taskIds: string[]): void {
  for (const taskId of taskIds) {
    const section = extractTaskSection(tasksMd, taskId)
    lines.push(`#### ${taskId}`)
    lines.push('')
    if (section) {
      const body = section.replace(/^###[^\n]+\n?/, '').trim()
      lines.push(body)
    } else {
      lines.push(`_Task section not found in tasks.md for ${taskId}._`)
    }
    lines.push('')
  }
}

function appendHumanGateBlock(
  lines: string[],
  phase: ExecutionPhase,
  nextPhase: ExecutionPhase | undefined,
): void {
  lines.push('## Human gate (mandatory stop)', '')
  lines.push(
    '**Do not start the next phase until the human explicitly confirms this phase is complete.**',
  )
  lines.push('')

  if (phase.humanGateReason?.trim()) {
    lines.push('### Why the human must act', '')
    lines.push(phase.humanGateReason.trim())
    lines.push('')
  }

  if (phase.userChecklist?.length) {
    lines.push('### User checklist', '')
    lines.push(formatChecklistItems(phase.userChecklist))
    lines.push('')
  }

  lines.push('After agent work for this phase:')
  lines.push('')
  lines.push('1. Summarize what was implemented and how exit criteria were verified.')
  lines.push('2. Ask the human to complete every item in the user checklist above.')
  lines.push('3. Ask the human to check off items in the NLIDE Build plan.')
  lines.push('4. **Wait** for the human to say "continue to the next phase" (or equivalent).')
  lines.push('')

  const exitCriteria = phase.exitCriteria ?? []
  if (exitCriteria.length > 0) {
    lines.push('### Exit criteria', '')
    for (const criterion of exitCriteria) {
      lines.push(`- [ ] ${criterion}`)
    }
    lines.push('')
  }

  lines.push('## Next step', '')
  if (nextPhase) {
    lines.push(
      `When the human confirms, proceed to [\`${nextPhase.id}\`](./${nextPhase.id}.md) — ${nextPhase.title}.`,
    )
  } else {
    lines.push('This is the **final phase**. When the human confirms, the execution plan is complete.')
  }
  lines.push('')
}

export function formatPhaseAgentBrief(
  phase: ExecutionPhase,
  tasksMd: string,
  plan: ExecutionPlan,
  phaseIndex: number,
  totalPhases: number,
): string {
  const phases = sortedPhases(plan)
  const nextPhase = phases[phaseIndex + 1]
  const lines = [
    `# ${phase.title}`,
    '',
    `- **Phase ID:** ${phase.id}`,
    `- **Order:** ${phase.order} of ${totalPhases}`,
    `- **Goal:** ${phase.goal}`,
    '',
  ]

  if (isLegacyExecutionPhase(phase)) {
    const titles = parseTaskTitles(tasksMd)
    const taskIds = resolvePhaseTaskIds(phase)
    lines.push('## Tasks in this phase', '')
    for (const taskId of taskIds) {
      const title = titles.get(taskId) ?? taskId
      lines.push(`### ${taskId}: ${title}`)
      lines.push('')
      const section = extractTaskSection(tasksMd, taskId)
      if (section) {
        const body = section.replace(/^###[^\n]+\n?/, '').trim()
        lines.push(body)
      } else {
        lines.push(`_Task section not found in tasks.md for ${taskId}._`)
      }
      lines.push('')
    }

    const exitCriteria = phase.exitCriteria ?? []
    lines.push('## Exit criteria', '')
    if (exitCriteria.length === 0) {
      lines.push('- All **Done when** criteria for tasks in this phase pass.')
    } else {
      for (const criterion of exitCriteria) {
        lines.push(`- ${criterion}`)
      }
    }
    lines.push('')
  } else {
    lines.push('## Agent work (this phase only)', '')
    lines.push(formatChecklistItems(phase.agentChecklist))
    lines.push('')

    const relatedIds = resolvePhaseTaskIds(phase)
    if (relatedIds.length > 0) {
      lines.push('## Related spec tasks (reference)', '')
      lines.push('Use these sections from `spec/tasks.md` for acceptance criteria and scope:')
      lines.push('')
      appendTaskSections(lines, tasksMd, relatedIds)
    }

    const exitCriteria = phase.exitCriteria ?? []
    if (exitCriteria.length > 0) {
      lines.push('## Exit criteria', '')
      for (const criterion of exitCriteria) {
        lines.push(`- ${criterion}`)
      }
      lines.push('')
    }
  }

  appendHumanGateBlock(lines, phase, nextPhase)
  return lines.join('\n')
}

export function formatExecuteInstructions(plan: ExecutionPlan): string {
  const phases = sortedPhases(plan)
  const lines = [
    '# Flow C execution instructions (agent)',
    '',
    'You are executing an NLIDE project from an exported handoff bundle. Follow these rules strictly.',
    '',
    '## Before you start',
    '',
    '1. Read `spec/INDEX.md`, then `spec/constraints.md`, then `spec/decisions.md`.',
    '2. Read `execution-plan/overview.md` for the full phase breakdown.',
    '3. Use `spec/tasks.md` and linked `spec/features.md` entries for acceptance criteria.',
    '4. Optional context: `synthesis/` for human intent in plain language.',
    '',
    '## Phase loop',
    '',
    'Execute **one phase at a time**. Never implement work from a future phase in the same session.',
    '',
  ]

  phases.forEach((phase, index) => {
    lines.push(`${index + 1}. Open and follow \`phases/${phase.id}.md\` (${phase.title}).`)
    if (isLegacyExecutionPhase(phase)) {
      const taskIds = resolvePhaseTaskIds(phase)
      lines.push(`   - Tasks: ${taskIds.join(', ') || 'see phase brief'}`)
    } else {
      lines.push(`   - Agent checklist: ${phase.agentChecklist.length} item(s)`)
      lines.push(`   - Human gate: ${phase.humanGateReason}`)
    }
    lines.push('   - Complete all agent work and verify exit criteria.')
    lines.push('   - **STOP.** Complete the user checklist with the human before continuing.')
    lines.push('')
  })

  lines.push('## Hard rules', '')
  lines.push('- Do not guess on items in `spec/open-questions.md` — ask the human.')
  lines.push('- Respect locked decisions in `spec/decisions.md`.')
  lines.push('- Do not skip human gates between phases.')
  lines.push('- Update task status in spec only when the human asks or as part of an agreed workflow.')
  lines.push('')

  return lines.join('\n')
}

export function formatHumanReadme(projectName: string, plan: ExecutionPlan, exportedAt: string): string {
  const phases = sortedPhases(plan)
  const date = handoffDateStamp(exportedAt)
  const firstPhase = phases[0]?.id ?? 'PHASE-001'
  const lines = [
    `# NLIDE execution handoff — ${projectName}`,
    '',
    `Exported: ${exportedAt}`,
    '',
    'This folder is ready for **Flow C** execution with Claude Code CLI (or another coding agent).',
    '',
    '## Quick start',
    '',
    '1. Unzip this bundle into your project workspace (or copy contents into your repo).',
    '2. Set your working directory to the repo root that will receive code changes:',
    '   ```bash',
    '   cd /path/to/your/project',
    '   ```',
    '3. Ensure `spec/` from this bundle is at `./spec/` (or merge with your existing spec).',
    '4. Run Claude Code **one phase at a time**:',
    '   ```bash',
    '   claude',
    '   ```',
    `   Then: "Follow EXECUTE.md and phases/${firstPhase}.md only."`,
    '',
    '5. After each phase, complete the **user checklist**, verify in NLIDE Build plan, then tell the agent to continue.',
    '',
    '## Folder layout',
    '',
    '| Path | Purpose |',
    '|------|---------|',
    '| `README.md` | This file (human guide) |',
    '| `EXECUTE.md` | Agent orchestration rules |',
    '| `manifest.json` | Export metadata |',
    '| `spec/` | Flow B intent markdown (nine files) |',
    '| `synthesis/` | Canvas card synthesis (human layer) |',
    '| `execution-plan/` | Plan JSON + overview |',
    '| `phases/` | Agent-ready brief per phase |',
    '| `progress.json` | Build plan checkbox snapshot at export time |',
    '',
    '## Phases in this export',
    '',
  ]

  for (const phase of phases) {
    if (isLegacyExecutionPhase(phase)) {
      const taskIds = resolvePhaseTaskIds(phase)
      lines.push(`- **${phase.title}** (\`${phase.id}\`) — ${taskIds.join(', ') || 'tasks in brief'}`)
    } else {
      lines.push(
        `- **${phase.title}** (\`${phase.id}\`) — ${phase.agentChecklist.length} agent + ${phase.userChecklist.length} user items`,
      )
    }
  }

  lines.push('')
  lines.push(`Bundle date stamp: \`${date}\``)
  lines.push('')

  return lines.join('\n')
}

/** Build relative-path → file content map for zipping (paths include root folder prefix). */
export function buildExecutionHandoffBundle(input: ExecutionHandoffInput): Record<string, string> {
  const exportedAt = input.exportedAt ?? new Date().toISOString()
  const root = `nlide-handoff-${handoffDateStamp(exportedAt)}`
  const files: Record<string, string> = {}
  const phases = sortedPhases(input.plan)

  const allTaskIds = [
    ...new Set(phases.flatMap((p) => resolvePhaseTaskIds(p))),
  ]

  const manifest: ExecutionHandoffManifest = {
    version: 'v1',
    exportedAt,
    projectName: input.projectName,
    specSource: input.specSource,
    planVersion: input.plan.planVersion,
    planSummary: input.plan.summary,
    planSchemaVersion: input.plan.version,
    phaseCount: phases.length,
    taskIds: allTaskIds,
    specFiles: SPEC_FILE_ALLOWLIST.filter((f) => input.spec[f]?.trim()),
  }

  const prefix = (rel: string) => `${root}/${rel}`

  files[prefix('README.md')] = formatHumanReadme(input.projectName, input.plan, exportedAt)
  files[prefix('EXECUTE.md')] = formatExecuteInstructions(input.plan)
  files[prefix('manifest.json')] = JSON.stringify(manifest, null, 2) + '\n'

  for (const file of SPEC_FILE_ALLOWLIST) {
    const content = input.spec[file]
    if (content?.trim()) {
      files[prefix(`spec/${file}`)] = content.endsWith('\n') ? content : `${content}\n`
    }
  }

  files[prefix('synthesis/INDEX.md')] = formatSynthesisMarkdown(input.synthesis, input.projectName)
  for (const file of SPEC_FILE_ALLOWLIST) {
    if (file === 'INDEX.md') continue
    const entries = input.synthesis.byFile[file]
    if (entries?.length) {
      const base = file.replace(/\.md$/, '')
      files[prefix(`synthesis/${base}.md`)] = formatSynthesisFileMarkdown(file, input.synthesis.cards)
    }
  }

  files[prefix('execution-plan/overview.md')] = formatExecutionPlanOverview(
    input.plan,
    input.tasksMd,
  )
  files[prefix('execution-plan/plan.json')] =
    JSON.stringify(
      {
        plan: input.plan,
        tasksMd: input.tasksMd,
      },
      null,
      2,
    ) + '\n'

  phases.forEach((phase, index) => {
    files[prefix(`phases/${phase.id}.md`)] = formatPhaseAgentBrief(
      phase,
      input.tasksMd,
      input.plan,
      index,
      phases.length,
    )
  })

  if (input.progress) {
    files[prefix('progress.json')] =
      JSON.stringify(
        {
          planVersion: input.plan.planVersion,
          completed: input.progress,
        },
        null,
        2,
      ) + '\n'
  }

  return files
}
