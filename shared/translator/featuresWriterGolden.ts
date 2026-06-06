import { formatFeatureSection } from './featuresWriterTemplate.ts'
import type { RouterPlan } from './types.ts'

/**
 * Golden features.md writer examples — Phase 3 · Job 3.
 * **[USER]** approved 2026-06-06 before features writer LLM ships.
 *
 * Maps router plan (features.md operation) → expected markdown patch output.
 */

export interface FeaturesWriterGoldenCase {
  id: string
  label: string
  /** Links to router golden prompt when applicable */
  goldenPromptId?: string
  userMessage: string
  routerPlan: RouterPlan
  /** Existing F-xxx markdown before writer runs (update cases) */
  existingSection?: string
  /** Full expected features.md section after writer runs */
  expectedSection: string
  mustInclude: string[]
  mustNotInclude?: string[]
  notes?: string
}

const F001_BEFORE = formatFeatureSection({
  id: 'F-001',
  title: 'Canvas interaction',
  status: 'approved',
  priority: 'high',
  description: 'Basic canvas navigation for the intent map.',
  acceptanceCriteria: ['User can select cards on the canvas'],
  related: ['tasks.md T-001'],
})

export const FEATURES_WRITER_GOLDEN: FeaturesWriterGoldenCase[] = [
  {
    id: 'fwg-01-update-pan-zoom',
    label: 'Update F-001 — pan and zoom',
    goldenPromptId: 'gp-01-canvas-pan-zoom',
    userMessage: 'Users should be able to pan and zoom the canvas.',
    routerPlan: {
      intent_type: 'update_feature',
      summary: 'Users should be able to pan and zoom the canvas.',
      operations: [{ target: 'features.md', action: 'update', entity_id: 'F-001' }],
      canvas_ops: [],
      open_questions: [],
    },
    existingSection: F001_BEFORE,
    expectedSection: formatFeatureSection({
      id: 'F-001',
      title: 'Canvas interaction',
      status: 'approved',
      priority: 'high',
      description: 'Users can pan, zoom, and navigate the intent canvas.',
      acceptanceCriteria: [
        'User can select cards on the canvas',
        'User can drag to pan the canvas viewport',
        'User can zoom in and out within configured min and max levels',
      ],
      related: ['tasks.md T-001'],
    }),
    mustInclude: ['F-001', 'pan', 'zoom', 'Acceptance criteria'],
    mustNotInclude: ['React Flow', 'minZoom', 'LoginForm'],
    notes: 'Merge new pan/zoom criteria with existing F-001 criteria.',
  },
  {
    id: 'fwg-02-update-layout',
    label: 'Update F-001 — canvas layout IA',
    goldenPromptId: 'gp-02-canvas-layout',
    userMessage:
      'Reorganize the canvas so Product is in the center, Frontend on the left, Backend on the right, with zoom layers between overview and detail.',
    routerPlan: {
      intent_type: 'update_feature',
      summary:
        'Reorganize canvas with Product center, Frontend left, Backend right, and zoom layers.',
      operations: [
        { target: 'features.md', action: 'update', entity_id: 'F-001' },
        { target: 'architecture.md', action: 'update' },
      ],
      canvas_ops: [],
      open_questions: [],
    },
    existingSection: F001_BEFORE,
    expectedSection: formatFeatureSection({
      id: 'F-001',
      title: 'Canvas interaction',
      status: 'approved',
      priority: 'high',
      description:
        'Layered canvas: Product at center, Frontend left, Backend right; overview and detail layers via zoom.',
      acceptanceCriteria: [
        'User can select cards on the canvas',
        'Overview layer shows Frontend, Product, and Backend pillars with Product centered',
        'User can drill into a pillar to see detail cards and return to overview',
        'User can pan and zoom between overview and detail layers',
      ],
      related: ['architecture.md (canvas IA)', 'tasks.md T-001'],
    }),
    mustInclude: ['Product', 'Frontend', 'Backend', 'overview', 'detail'],
    mustNotInclude: ['open-questions.md'],
    notes: 'Writer patches features.md only in this golden; architecture.md is a separate writer.',
  },
  {
    id: 'fwg-03-add-google-login',
    label: 'Add F-002 — Google login',
    goldenPromptId: 'gp-03-add-feature',
    userMessage: 'Add Google login for enterprise users.',
    routerPlan: {
      intent_type: 'add_feature',
      summary: 'Add Google login for enterprise users.',
      operations: [
        { target: 'features.md', action: 'add' },
        { target: 'tasks.md', action: 'add' },
      ],
      canvas_ops: [],
      open_questions: [],
    },
    expectedSection: formatFeatureSection({
      id: 'F-002',
      title: 'Google login for enterprise users',
      status: 'proposed',
      priority: 'high',
      description: 'Users sign in with their Google Workspace account.',
      acceptanceCriteria: [
        'User can sign in with Google via OAuth',
        'Only accounts from allowed enterprise domains can access the app',
        'Admin can revoke a user\'s access',
      ],
      related: ['users.md (enterprise admin)', 'tasks.md'],
    }),
    mustInclude: ['F-002', 'Google', 'enterprise', 'Acceptance criteria'],
    mustNotInclude: ['F-001', 'LoginForm.tsx'],
    notes: 'New ID F-002 when F-001 exists; tasks.md writer is separate golden phase.',
  },
  {
    id: 'fwg-04-add-minimal',
    label: 'Add F-003 — short user message',
    userMessage: 'Add export to PDF for the spec.',
    routerPlan: {
      intent_type: 'add_feature',
      summary: 'Add export to PDF for the spec.',
      operations: [
        { target: 'features.md', action: 'add' },
        { target: 'tasks.md', action: 'add' },
      ],
      canvas_ops: [],
      open_questions: [],
    },
    expectedSection: formatFeatureSection({
      id: 'F-003',
      title: 'Export spec to PDF',
      status: 'proposed',
      priority: 'medium',
      description: 'Users can export the current intent spec as a PDF document.',
      acceptanceCriteria: [
        'User can trigger export from the product UI and receive a PDF of the current spec',
        'Exported PDF includes feature list and linked task summaries',
      ],
      related: ['tasks.md'],
    }),
    mustInclude: ['F-003', 'PDF', 'export'],
    mustNotInclude: ['puppeteer', 'npm'],
    notes: 'Writer infers reasonable criteria when user gives minimal scope.',
  },
]

/** Minimum passing writer golden cases before features writer ships (Phase 3 Agent mode). */
export const FEATURES_WRITER_GOLDEN_PASS_BAR = {
  minPass: 3,
  total: FEATURES_WRITER_GOLDEN.length,
  description: '≥3/4 features writer golden cases pass section + mustInclude checks',
} as const

export function getFeaturesWriterGolden(): FeaturesWriterGoldenCase[] {
  return FEATURES_WRITER_GOLDEN
}

/** Non-LLM check: expected section contains required phrases and avoids forbidden ones. */
export function evaluateFeaturesWriterGolden(
  actualSection: string,
  golden: FeaturesWriterGoldenCase,
): { pass: boolean; failures: string[] } {
  const failures: string[] = []
  const lower = actualSection.toLowerCase()

  for (const phrase of golden.mustInclude) {
    if (!lower.includes(phrase.toLowerCase())) {
      failures.push(`missing required phrase: ${phrase}`)
    }
  }

  for (const phrase of golden.mustNotInclude ?? []) {
    if (lower.includes(phrase.toLowerCase())) {
      failures.push(`must not include: ${phrase}`)
    }
  }

  if (!/^### F-\d{3}:/m.test(actualSection)) {
    failures.push('section must start with ### F-xxx: heading')
  }

  if (!/Acceptance criteria:/i.test(actualSection)) {
    failures.push('section must include Acceptance criteria block')
  }

  return { pass: failures.length === 0, failures }
}
