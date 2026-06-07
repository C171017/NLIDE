#!/usr/bin/env node
/**
 * Smoke tests for execution plan validator + stub.
 * Run: node scripts/test-execution-plan.mjs
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const tasksMd = readFileSync(join(root, 'spec/tasks.md'), 'utf8')

function extractEntityIds(content, prefix) {
  const pattern = new RegExp(`### (${prefix}-\\d{3}):`, 'g')
  const ids = []
  let match
  while ((match = pattern.exec(content)) !== null) ids.push(match[1])
  return ids
}

function validate(plan, tasks) {
  const expected = extractEntityIds(tasks, 'T')
  const assigned = new Map()
  const issues = []
  const warnings = []

  for (const phase of plan.phases) {
    for (const taskId of phase.taskIds) {
      if (!expected.includes(taskId)) {
        issues.push(`orphan ${taskId}`)
      }
      if (assigned.has(taskId)) issues.push(`duplicate ${taskId}`)
      else assigned.set(taskId, phase.id)
    }
  }
  for (const taskId of expected) {
    if (!assigned.has(taskId)) warnings.push(`missing ${taskId}`)
  }
  return { issues, warnings }
}

const tasks = extractEntityIds(tasksMd, 'T')
const plan = {
  phases: [
    {
      id: 'PHASE-001',
      taskIds: tasks.slice(0, Math.ceil(tasks.length / 2)),
    },
    {
      id: 'PHASE-002',
      taskIds: tasks.slice(Math.ceil(tasks.length / 2)),
    },
  ],
}

const full = validate(plan, tasksMd)
if (full.issues.length > 0) {
  console.error('FAIL valid plan:', full.issues)
  process.exit(1)
}

const partialPlan = {
  phases: [{ id: 'PHASE-001', taskIds: tasks.slice(0, 1) }],
}
const partial = validate(partialPlan, tasksMd)
if (partial.issues.length > 0) {
  console.error('FAIL partial plan should not hard-fail:', partial.issues)
  process.exit(1)
}
if (partial.warnings.length === 0) {
  console.error('FAIL expected missing-task warnings on partial plan')
  process.exit(1)
}

const orphanPlan = {
  phases: [{ id: 'PHASE-001', taskIds: ['T-999'] }],
}
const orphan = validate(orphanPlan, tasksMd)
if (!orphan.issues.some((i) => i.startsWith('orphan'))) {
  console.error('FAIL expected orphan task error')
  process.exit(1)
}

console.log('OK execution plan validator smoke (' + tasks.length + ' tasks)')
