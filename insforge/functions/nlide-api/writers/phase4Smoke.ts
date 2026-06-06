import { GOLDEN_ROUTER_FIXTURE } from '../_shared/translator/index.ts'
import { validateSpec } from '../validator/validateSpec.ts'
import { applyPatchesToSpec, runWritersFromPlan } from './pipeline.ts'

/** Phase 4 smoke: route gp-03 add feature → writers → validator. */
export async function runPhase4Smoke() {
  const golden = GOLDEN_ROUTER_FIXTURE.find((row) => row.id === 'gp-03-add-feature')
  if (!golden) {
    return { ok: false, error: { code: 'smoke_missing_fixture', message: 'gp-03 fixture not found' } }
  }

  const writers = await runWritersFromPlan({
    userMessage: golden.message,
    routerPlan: golden.expectedPlan,
    existingFeatureIds: ['F-001'],
    existingTaskIds: ['T-001'],
    existingSpec: {
      'features.md': '### F-001: Intent canvas\n\n- **Status:** in_progress\n- **Priority:** high\n- **Description:** Canvas navigation.\n- **Acceptance criteria:**\n  - User can select cards on the canvas',
      'tasks.md': '### T-001: Build canvas\n\n- **Feature:** F-001\n- **Status:** in_progress\n- **Instructions for agent:**\n  1. Build React Flow canvas\n- **Done when:** All acceptance criteria for F-001 pass',
    },
  })

  if (!writers.ok) {
    return {
      ok: false,
      stage: 'writers',
      error: writers.error,
    }
  }

  const spec = applyPatchesToSpec(
    {
      'features.md': '### F-001: Intent canvas\n\n- **Status:** in_progress\n- **Priority:** high\n- **Description:** Canvas navigation.\n- **Acceptance criteria:**\n  - User can select cards on the canvas',
      'tasks.md': '### T-001: Build canvas\n\n- **Feature:** F-001\n- **Status:** in_progress\n- **Instructions for agent:**\n  1. Build React Flow canvas\n- **Done when:** All acceptance criteria for F-001 pass',
    },
    writers.patches,
  )

  const validation = validateSpec({
    spec,
    routerPlan: golden.expectedPlan,
    mode: 'preview',
  })

  return {
    ok: validation.ok,
    stage: validation.ok ? 'complete' : 'validator',
    patchCount: writers.patches.length,
    patches: writers.patches.map((p) => ({ file: p.file, anchor: p.anchor, action: p.action })),
    validation: {
      ok: validation.ok,
      issueCount: validation.issues.length,
      warningCount: validation.warnings.length,
      issues: [...validation.issues, ...validation.warnings].map((row) => ({
        ruleId: row.ruleId,
        message: row.message,
      })),
    },
    models: writers.models,
  }
}
