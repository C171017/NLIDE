import type { ProgressChecklistPayload } from '../types/canvas'

/** Step 1 human approval checklist — gates Agent-mode router implementation. */
export const ROUTER_CONTRACT_CHECKLIST: ProgressChecklistPayload = {
  checklistId: 'router-contract-v1',
  phaseLabel: 'Step 1: Router contract approval',
  readyLabel: 'Ready for Agent mode — implement routeIntent()',
  blockedLabel: 'Not ready for Agent mode',
  items: [
    {
      id: 'routing-policy',
      label: 'Routing policy (5–10 bullets)',
      detail: 'e.g. canvas UX → update F-001; new capability → features + tasks',
    },
    {
      id: 'intent-type-enum',
      label: 'intent_type enum',
      detail: 'add_feature, update_feature, clarify, …',
    },
    {
      id: 'schema-fields',
      label: 'Hardcoded schema fields',
      detail: 'summary, operations[], canvas_ops[], open_questions[]',
    },
    {
      id: 'spec-allowlist',
      label: 'Spec file allowlist',
      detail: 'Flow B nine files only (INDEX.md … open-questions.md)',
    },
    {
      id: 'golden-prompts',
      label: 'Golden prompts (8 cases)',
      detail: 'Message + expected intent_type + targets + must-not rules',
    },
    {
      id: 'pass-bar',
      label: 'Pass bar for Step 1',
      detail: 'e.g. ≥8/10 golden prompts pass via action:"route" + Zod',
    },
  ],
}
