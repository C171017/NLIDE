/** Per-phase execution tracking — Agent shipped vs human verification tasks. */

export interface PhaseHumanTask {
  id: string
  label: string
  detail?: string
}

export interface PhaseExecutionConfig {
  /** Agent code for this phase exists in the repo. */
  agentShipped: boolean
  /** What the human runs or verifies after briefs are approved. */
  humanTasks: PhaseHumanTask[]
}

export const PHASE_EXECUTION: Record<string, PhaseExecutionConfig> = {
  'phase-0-preview-loop': {
    agentShipped: true,
    humanTasks: [
      {
        id: 'manual-preview-ux',
        label: 'Manual test: chat → preview → commit / discard',
        detail: 'npm run dev — walk the canvas chat loop',
      },
      {
        id: 'health-check',
        label: 'Optional: API health check',
        detail: 'npm run insforge:invoke:health',
      },
    ],
  },
  'phase-1-router-contract': {
    agentShipped: true,
    humanTasks: [
      {
        id: 'spec-smoke',
        label: 'Optional: translator spec loads',
        detail: 'get-translator-spec — brief approval was the main gate',
      },
    ],
  },
  'phase-2-router-build': {
    agentShipped: true,
    humanTasks: [
      {
        id: 'openrouter-secret',
        label: 'Add OPENROUTER_API_KEY function secret',
        detail: 'npx @insforge/cli ai setup → insforge secrets add',
      },
      {
        id: 'deploy-api',
        label: 'Deploy nlide-api with router',
        detail: 'npm run insforge:deploy:api',
      },
      {
        id: 'route-smoke',
        label: 'Run route smoke test',
        detail: 'npm run insforge:invoke:route-smoke → update_feature',
      },
      {
        id: 'route-golden',
        label: 'Run golden batch (≥8/10 pass)',
        detail: 'npm run insforge:invoke:route-golden',
      },
    ],
  },
  'phase-3-features-writer': {
    agentShipped: true,
    humanTasks: [
      {
        id: 'deploy-writer',
        label: 'Deploy nlide-api with features writer',
        detail: 'npm run insforge:deploy:api',
      },
      {
        id: 'writer-golden',
        label: 'Run features writer golden tests',
        detail: 'npm run insforge:invoke:write-features-golden — ≥3/4 pass',
      },
    ],
  },
  'phase-4-writers-validator': {
    agentShipped: true,
    humanTasks: [
      {
        id: 'deploy-phase4',
        label: 'Deploy nlide-api with Phase 4 writers + validator',
        detail: 'npm run insforge:deploy:api',
      },
      {
        id: 'phase4-smoke',
        label: 'Run Phase 4 smoke (writers + validator)',
        detail: 'npm run insforge:invoke:phase4-smoke',
      },
    ],
  },
  'phase-5-canvas-mapper': {
    agentShipped: true,
    humanTasks: [
      {
        id: 'mapper-golden',
        label: 'Run canvas mapper golden tests',
        detail: 'npm run insforge:invoke:canvas-mapper-golden — ≥4/5 pass',
      },
      {
        id: 'manual-preview-ghost',
        label: 'Manual test: ghost cards + mdPatches summary on canvas',
        detail: 'npm run dev — chat → preview → verify dashed cards and side panel list',
      },
    ],
  },
  'phase-6-export': {
    agentShipped: false,
    humanTasks: [],
  },
}

export function getPhaseExecution(checklistId: string): PhaseExecutionConfig | undefined {
  return PHASE_EXECUTION[checklistId]
}
