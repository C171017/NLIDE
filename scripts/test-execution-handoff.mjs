#!/usr/bin/env node --experimental-strip-types
/**
 * Smoke tests for execution handoff bundle builder.
 * Run: node scripts/test-execution-handoff.mjs
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildExecutionHandoffBundle } from '../shared/translator/buildExecutionHandoff.ts'
import { SPEC_FILE_ALLOWLIST } from '../shared/translator/intentTypes.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const specDir = join(root, 'spec')

function loadSpec() {
  const spec = {}
  for (const file of SPEC_FILE_ALLOWLIST) {
    const path = join(specDir, file)
    try {
      spec[file] = readFileSync(path, 'utf8')
    } catch {
      spec[file] = ''
    }
  }
  return spec
}

function extractTaskIds(tasksMd) {
  const pattern = /### (T-\d{3}):/g
  const ids = []
  let match
  while ((match = pattern.exec(tasksMd)) !== null) ids.push(match[1])
  return ids
}

const spec = loadSpec()
const tasksMd = spec['tasks.md'] ?? ''
const taskIds = extractTaskIds(tasksMd)

if (taskIds.length === 0) {
  console.error('FAIL: no tasks in spec/tasks.md')
  process.exit(1)
}

const mid = Math.ceil(taskIds.length / 2)
const plan = {
  version: 'v1',
  summary: 'Smoke test handoff bundle',
  rationale: 'Split tasks for validator smoke',
  planVersion: 'smoke-test-plan',
  generatedAt: new Date().toISOString(),
  phases: [
    {
      id: 'PHASE-001',
      order: 1,
      title: 'Phase 1 — Foundation',
      goal: 'First half of tasks',
      taskIds: taskIds.slice(0, mid),
      exitCriteria: ['First half tasks pass Done when criteria'],
      blocks: ['PHASE-002'],
    },
    {
      id: 'PHASE-002',
      order: 2,
      title: 'Phase 2 — Finish',
      goal: 'Remaining tasks',
      taskIds: taskIds.slice(mid),
      exitCriteria: ['All tasks complete'],
    },
  ],
}

const bundle = buildExecutionHandoffBundle({
  projectName: 'NLIDE Smoke',
  spec,
  synthesis: { cards: [], byFile: {} },
  plan,
  tasksMd,
  specSource: 'repo',
  progress: { 'PHASE-001': { 'T-001': true } },
  exportedAt: '2026-06-06T12:00:00.000Z',
})

const paths = Object.keys(bundle)
const rootPrefix = 'nlide-handoff-2026-06-06/'

if (!paths.every((p) => p.startsWith(rootPrefix))) {
  console.error('FAIL: bundle paths must use dated root folder')
  process.exit(1)
}

const required = [
  `${rootPrefix}README.md`,
  `${rootPrefix}EXECUTE.md`,
  `${rootPrefix}manifest.json`,
  `${rootPrefix}execution-plan/overview.md`,
  `${rootPrefix}execution-plan/plan.json`,
  `${rootPrefix}phases/PHASE-001.md`,
  `${rootPrefix}phases/PHASE-002.md`,
  `${rootPrefix}progress.json`,
]

for (const rel of required) {
  if (!bundle[rel]) {
    console.error('FAIL: missing', rel)
    process.exit(1)
  }
}

for (const file of SPEC_FILE_ALLOWLIST) {
  const rel = `${rootPrefix}spec/${file}`
  if (spec[file]?.trim() && !bundle[rel]) {
    console.error('FAIL: missing spec file in bundle', file)
    process.exit(1)
  }
}

const manifest = JSON.parse(bundle[`${rootPrefix}manifest.json`])
if (manifest.version !== 'v1' || manifest.phaseCount !== 2) {
  console.error('FAIL: invalid manifest', manifest)
  process.exit(1)
}

const phase1 = bundle[`${rootPrefix}phases/PHASE-001.md`]
for (const taskId of plan.phases[0].taskIds) {
  if (!phase1.includes(taskId)) {
    console.error('FAIL: phase brief missing task', taskId)
    process.exit(1)
  }
}

if (!phase1.includes('Human gate (mandatory stop)')) {
  console.error('FAIL: phase brief missing human gate section')
  process.exit(1)
}

const execute = bundle[`${rootPrefix}EXECUTE.md`]
if (!execute.includes('phases/PHASE-001.md')) {
  console.error('FAIL: EXECUTE.md missing phase reference')
  process.exit(1)
}

console.log('OK execution handoff smoke (' + paths.length + ' files, ' + taskIds.length + ' tasks)')
