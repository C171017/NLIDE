#!/usr/bin/env node --experimental-strip-types
/**
 * Smoke tests for execution plan validator (v2) + stub.
 * Run: node scripts/test-execution-plan.mjs
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildExecutionPlanStub } from '../shared/translator/executionPlanStub.ts'
import { validateExecutionPlan } from '../shared/translator/validateExecutionPlan.ts'
import { SPEC_FILE_ALLOWLIST } from '../shared/translator/intentTypes.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const specDir = join(root, 'spec')

function loadSpec() {
  const spec = {}
  for (const file of SPEC_FILE_ALLOWLIST) {
    try {
      spec[file] = readFileSync(join(specDir, file), 'utf8')
    } catch {
      spec[file] = ''
    }
  }
  return spec
}

function assertOk(label, result) {
  if (!result.ok) {
    console.error(`FAIL ${label}:`, result.issues)
    process.exit(1)
  }
}

function assertFail(label, result, ruleId) {
  if (result.ok) {
    console.error(`FAIL ${label}: expected validation failure`)
    process.exit(1)
  }
  if (ruleId && !result.issues.some((i) => i.ruleId === ruleId)) {
    console.error(`FAIL ${label}: expected ruleId ${ruleId}, got`, result.issues)
    process.exit(1)
  }
}

const spec = loadSpec()
const tasksMd = spec['tasks.md'] ?? ''

const stubPlan = buildExecutionPlanStub(spec)
const stubResult = validateExecutionPlan(stubPlan, tasksMd)
assertOk('stub plan structural validation', stubResult)

if (stubPlan.version !== 'v2') {
  console.error('FAIL stub plan should use v2 schema')
  process.exit(1)
}

for (const phase of stubPlan.phases) {
  if (!phase.humanGateReason?.trim()) {
    console.error(`FAIL phase ${phase.id} missing humanGateReason`)
    process.exit(1)
  }
  if ((phase.agentChecklist?.length ?? 0) === 0) {
    console.error(`FAIL phase ${phase.id} missing agentChecklist`)
    process.exit(1)
  }
  if ((phase.userChecklist?.length ?? 0) === 0) {
    console.error(`FAIL phase ${phase.id} missing userChecklist`)
    process.exit(1)
  }
}

const validV2 = {
  version: 'v2',
  summary: 'Two-phase smoke plan',
  phases: [
    {
      id: 'PHASE-001',
      order: 1,
      title: 'Foundation',
      goal: 'Scaffold auth',
      humanGateReason: 'User must add OAuth client ID and secret',
      agentChecklist: [{ id: 'A-001', label: 'Wire OAuth callback route' }],
      userChecklist: [{ id: 'U-001', label: 'Add GOOGLE_CLIENT_ID', kind: 'api_key' }],
      relatedTaskIds: ['T-001'],
    },
    {
      id: 'PHASE-002',
      order: 2,
      title: 'UI',
      goal: 'Login button',
      humanGateReason: 'User approves UI before deploy',
      agentChecklist: [{ id: 'A-001', label: 'Build login page' }],
      userChecklist: [{ id: 'U-001', label: 'Review login flow', kind: 'approval' }],
    },
  ],
  planVersion: '00000000-0000-4000-8000-000000000001',
  generatedAt: new Date().toISOString(),
  model: 'test',
}

assertOk('valid v2 plan', validateExecutionPlan(validV2, tasksMd))

const orphanRelated = {
  ...validV2,
  phases: [
    {
      ...validV2.phases[0],
      relatedTaskIds: ['T-999'],
    },
    validV2.phases[1],
  ],
}
const orphanResult = validateExecutionPlan(orphanRelated, tasksMd)
assertOk('orphan relatedTaskIds is warning-only', orphanResult)
if (!orphanResult.warnings.some((w) => w.ruleId === 'orphan_related_task')) {
  console.error('FAIL expected orphan_related_task warning')
  process.exit(1)
}

const duplicatePhase = {
  ...validV2,
  phases: [
    { ...validV2.phases[0], id: 'PHASE-001' },
    { ...validV2.phases[1], id: 'PHASE-001', order: 2 },
  ],
}
assertFail('duplicate phase IDs', validateExecutionPlan(duplicatePhase, tasksMd), 'duplicate_phase_id')

const emptyPlan = { ...validV2, phases: [] }
assertFail('empty plan', validateExecutionPlan(emptyPlan, tasksMd), 'empty_plan')

const legacyPlan = {
  version: 'v1',
  summary: 'Legacy task grouping',
  phases: [{ id: 'PHASE-001', order: 1, title: 'All', goal: 'Do tasks', taskIds: ['T-999'] }],
  planVersion: '00000000-0000-4000-8000-000000000002',
  generatedAt: new Date().toISOString(),
  model: 'test',
}
assertFail('legacy orphan task hard-fails', validateExecutionPlan(legacyPlan, tasksMd), 'orphan_task')

console.log(
  `OK execution plan v2 validator smoke (${stubPlan.phases.length} stub phases, ${tasksMd.match(/### T-\d{3}:/g)?.length ?? 0} tasks in spec)`,
)
