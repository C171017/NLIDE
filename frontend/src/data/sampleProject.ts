import type { CanvasState } from '../types/canvas'
import { BUILD_PHASES } from '@nlide/shared'
import { phaseToChecklistPayload } from '../lib/buildPhaseUtils'

/** Legacy demo canvas — superseded by `loadSpecCanvas()` + repo `spec/*.md`. Kept for reference/tests. */

const PHASE_6 = BUILD_PHASES.find((phase) => phase.id === 'phase-6-export')!

export const SAMPLE_PROJECT_NAME = 'NLIDE'

export const sampleCanvas: CanvasState = {
  centerCardId: 'product',
  cards: [
    {
      id: 'product',
      specRef: { file: 'product.md' },
      type: 'product',
      title: 'NLIDE',
      body: 'Natural Language IDE — an intent canvas where humans define what to build; agents execute from exported spec.',
      position: { x: 0, y: -150 },
      layer: 0,
      status: 'approved',
    },
    {
      id: 'frontend',
      specRef: { file: 'architecture.md', anchor: 'frontend' },
      type: 'frontend',
      title: 'Frontend',
      body: 'React canvas UI, card editor, chat bar, and visualization embeds — the human-facing intent surface.',
      position: { x: -520, y: 0 },
      layer: 0,
      status: 'in_progress',
    },
    {
      id: 'backend',
      specRef: { file: 'architecture.md', anchor: 'backend' },
      type: 'backend',
      title: 'Backend',
      body: 'InsForge edge functions, Postgres for runtime state, translator pipeline, and spec export on commit.',
      position: { x: 520, y: 0 },
      layer: 0,
      status: 'in_progress',
    },
    {
      id: 'users',
      specRef: { file: 'users.md' },
      type: 'users',
      title: 'Users',
      body: 'Solo builders and small teams who want to clarify intent visually before delegating implementation to AI agents.',
      position: { x: -280, y: -220 },
      layer: 1,
      parentCardId: 'product',
      status: 'approved',
    },
    {
      id: 'features',
      specRef: { file: 'features.md', anchor: 'F-001' },
      type: 'feature',
      title: 'F-001: Intent canvas',
      body: 'Users arrange cards on a pannable canvas with links between intent nodes.',
      position: { x: 0, y: 280 },
      layer: 1,
      parentCardId: 'product',
      status: 'in_progress',
      vizType: 'data-table',
      vizPayload: {
        columns: ['ID', 'Title', 'Status', 'Priority'],
        rows: [
          ['F-001', 'Intent canvas', 'in_progress', 'high'],
          ['F-002', 'Chat → preview → commit', 'proposed', 'high'],
          ['F-003', 'Manual card editing', 'proposed', 'medium'],
        ],
      },
    },
    {
      id: 'tasks',
      specRef: { file: 'tasks.md', anchor: 'T-001' },
      type: 'task',
      title: 'T-001: Build React Flow canvas',
      body: 'Implement layered canvas with Product center, Frontend/Backend pillars, and zoom-based detail views.',
      position: { x: -520, y: 280 },
      layer: 1,
      parentCardId: 'frontend',
      status: 'in_progress',
    },
    {
      id: 'architecture',
      specRef: { file: 'architecture.md' },
      type: 'architecture',
      title: 'Architecture',
      body: 'React frontend, InsForge edge functions, Postgres for runtime state, MD export on commit.',
      position: { x: 520, y: -220 },
      layer: 1,
      parentCardId: 'backend',
      status: 'approved',
      vizType: 'mermaid',
      vizPayload: `flowchart LR
  User --> Chat
  Chat --> Translator
  Translator --> Preview
  Preview -->|Commit| Postgres
  Preview -->|Commit| SpecMD
  Canvas --> Postgres`,
    },
    {
      id: 'translator-step1',
      specRef: { file: 'tasks.md', anchor: 'T-002' },
      type: 'task',
      title: 'Phase 6: Export on commit',
      body: 'Approve export scope and spec/ layout in Build plan, then Agent mode wires commit + end-to-end pipeline.',
      position: { x: 720, y: 280 },
      layer: 1,
      parentCardId: 'backend',
      status: 'in_progress',
      vizType: 'progress-checklist',
      vizPayload: phaseToChecklistPayload(PHASE_6),
    },
  ],
  edges: [
    { id: 'e-product-frontend', source: 'product', target: 'frontend', label: 'has' },
    { id: 'e-product-backend', source: 'product', target: 'backend', label: 'has' },
    { id: 'e-frontend-backend', source: 'frontend', target: 'backend', label: 'calls' },
    { id: 'e-product-users', source: 'product', target: 'users', label: 'serves' },
    { id: 'e-product-features', source: 'product', target: 'features', label: 'contains' },
    { id: 'e-frontend-tasks', source: 'frontend', target: 'tasks', label: 'implements' },
    { id: 'e-features-tasks', source: 'features', target: 'tasks', label: 'implements' },
    { id: 'e-backend-architecture', source: 'backend', target: 'architecture', label: 'describes' },
    {
      id: 'e-architecture-translator-step1',
      source: 'architecture',
      target: 'translator-step1',
      label: 'next build step',
    },
  ],
}
