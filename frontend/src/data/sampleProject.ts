import type { CanvasState } from '../types/canvas'
import { ROUTER_CONTRACT_CHECKLIST } from './routerContractProgress'

export const SAMPLE_PROJECT_NAME = 'NLIDE'

export const sampleCanvas: CanvasState = {
  centerCardId: 'index',
  cards: [
    {
      id: 'index',
      specRef: { file: 'INDEX.md' },
      type: 'index',
      title: 'NLIDE',
      body: 'Natural Language IDE — an intent canvas where humans define what to build; agents execute from exported spec.',
      position: { x: 0, y: 0 },
      vizType: 'force-graph',
      vizPayload: {
        nodes: [
          { id: 'index', label: 'Index' },
          { id: 'product', label: 'Product' },
          { id: 'users', label: 'Users' },
          { id: 'features', label: 'Features' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'architecture', label: 'Architecture' },
          { id: 'translator-step1', label: 'Step 1' },
        ],
        links: [
          { source: 'index', target: 'product' },
          { source: 'index', target: 'users' },
          { source: 'index', target: 'features' },
          { source: 'index', target: 'tasks' },
          { source: 'index', target: 'architecture' },
          { source: 'index', target: 'translator-step1' },
          { source: 'features', target: 'tasks' },
          { source: 'features', target: 'architecture' },
        ],
      },
    },
    {
      id: 'product',
      specRef: { file: 'product.md' },
      type: 'product',
      title: 'Product',
      body: 'A web-first intent canvas for defining software projects in natural language before handing off to execution agents.',
      position: { x: -320, y: -200 },
      status: 'approved',
    },
    {
      id: 'users',
      specRef: { file: 'users.md' },
      type: 'users',
      title: 'Users',
      body: 'Solo builders and small teams who want to clarify intent visually before delegating implementation to AI agents.',
      position: { x: 320, y: -200 },
      status: 'approved',
    },
    {
      id: 'features',
      specRef: { file: 'features.md', anchor: 'F-001' },
      type: 'feature',
      title: 'F-001: Intent canvas',
      body: 'Users arrange cards on a pannable canvas with links between intent nodes.',
      position: { x: -360, y: 180 },
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
      body: 'Implement the main canvas with Index hub, card nodes, and labeled edges.',
      position: { x: 0, y: 280 },
      status: 'in_progress',
    },
    {
      id: 'architecture',
      specRef: { file: 'architecture.md' },
      type: 'architecture',
      title: 'Architecture',
      body: 'React frontend, InsForge edge functions, Postgres for runtime state, MD export on commit.',
      position: { x: 360, y: 180 },
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
      title: 'Step 1: Router contract',
      body: 'Approve schema, routing policy, and golden prompts before Agent implements routeIntent().',
      position: { x: 560, y: 320 },
      status: 'in_progress',
      vizType: 'progress-checklist',
      vizPayload: ROUTER_CONTRACT_CHECKLIST,
    },
  ],
  edges: [
    { id: 'e-index-product', source: 'index', target: 'product', label: 'defines' },
    { id: 'e-index-users', source: 'index', target: 'users', label: 'serves' },
    { id: 'e-index-features', source: 'index', target: 'features', label: 'contains' },
    { id: 'e-index-tasks', source: 'index', target: 'tasks', label: 'contains' },
    { id: 'e-index-architecture', source: 'index', target: 'architecture', label: 'describes' },
    { id: 'e-features-tasks', source: 'features', target: 'tasks', label: 'implements' },
    { id: 'e-features-architecture', source: 'features', target: 'architecture', label: 'requires' },
    {
      id: 'e-architecture-translator-step1',
      source: 'architecture',
      target: 'translator-step1',
      label: 'next build step',
    },
  ],
}
