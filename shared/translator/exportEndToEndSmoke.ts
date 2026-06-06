/**
 * End-to-end export smoke path — Phase 6 · Job 3.
 * **[USER]** approved 2026-06-06 before commit export ships in Agent mode.
 *
 * How to verify chat → preview → commit → spec/ on disk — manual UI path,
 * CLI invoke sequence, pass bar, and disk-write helper.
 */

import { SPEC_FILE_ALLOWLIST } from './intentTypes.ts'

export interface ExportSmokeStep {
  id: string
  order: number
  label: string
  actor: 'user' | 'system' | 'dev'
  detail: string
  verify?: string[]
}

export interface ExportSmokeCliStep {
  id: string
  label: string
  command: string
  expect: string[]
}

export interface ExportEndToEndSmoke {
  policy: string
  passBar: string
  prerequisites: string[]
  manualUiPath: ExportSmokeStep[]
  cliPath: ExportSmokeCliStep[]
  diskWriteScript: string
  diskWriteUsage: string[]
  commitSuccessShape: string
  verificationChecklist: string[]
  stubCommitExpectations: string[]
  failureModes: string[]
  agentModeDeliverables: string[]
  explicitNonGoals: string[]
}

/** Default chat message for smoke — triggers stub F-004 + open-question preview. */
export const EXPORT_SMOKE_MESSAGE =
  'Add Google login for enterprise users. Which domains are allowed?'

export const EXPORT_SMOKE_PASS_BAR = '9/9 spec files on disk + INDEX agent rules + stub F-004 in features.md'

const EXPORT_VERIFICATION_CHECKLIST: string[] = [
  `spec/ contains exactly ${SPEC_FILE_ALLOWLIST.length} files matching allowlist`,
  'spec/INDEX.md — project name, file table, agent routing rules block',
  'spec/features.md — ### F-xxx headings with Status, Priority, Acceptance criteria',
  'spec/tasks.md — valid scaffold or T-xxx sections',
  'spec/constraints.md — ## Stack / Patterns / Non-goals structure (may be empty)',
  'Each file ends with single newline; no YAML front matter',
  'git status shows spec/*.md after first export (if git-tracked)',
]

export const EXPORT_END_TO_END_SMOKE: ExportEndToEndSmoke = {
  policy:
    'Phase 6 is done when a human can walk chat → preview → commit and find all nine Flow B files ' +
    'under repo `spec/` with content matching Postgres spec_sections. Smoke covers UI path (primary) ' +
    'and CLI path (headless regression). Export assembly uses exportScopeOnCommit + specFolderLayout.',

  passBar: EXPORT_SMOKE_PASS_BAR,

  prerequisites: [
    'npm run insforge:link && npm run insforge:migrate — Postgres schema including spec_sections',
    'npm run insforge:deploy:api — nlide-api with Phase 6 commit export (Agent mode)',
    'frontend/.env.local → VITE_INSFORGE_FUNCTION_URL set (not local stub for full path)',
    'OPENROUTER_API_KEY optional for smoke — stub intent preview works without LLM',
  ],

  manualUiPath: [
    {
      id: 'start-dev',
      order: 1,
      label: 'Start dev server',
      actor: 'dev',
      detail: 'npm run dev — canvas loads with Product center node.',
      verify: ['Chat bar visible on canvas', 'Build plan tab shows Phase 6'],
    },
    {
      id: 'chat-submit',
      order: 2,
      label: 'Submit chat message',
      actor: 'user',
      detail: `Type smoke message (or any text) and press Enter / interpret button.`,
      verify: ['Preview loads — ghost open-question card + dashed edges', 'Side panel shows preview summary + mdPatches'],
    },
    {
      id: 'review-preview',
      order: 3,
      label: 'Review preview',
      actor: 'user',
      detail: 'Confirm ghost cards and mdPatches list before commit — never auto-applied.',
      verify: ['Commit and Discard buttons enabled', 'features.md patch mentions F-004 (stub)'],
    },
    {
      id: 'commit',
      order: 4,
      label: 'Commit preview',
      actor: 'user',
      detail: 'Click Commit — applies canvas to Postgres and triggers spec export.',
      verify: [
        'Ghost cards become solid committed cards',
        'Preview state clears',
        'Toast or panel shows spec exported (9 files) when wired',
      ],
    },
    {
      id: 'write-disk',
      order: 5,
      label: 'Write spec/ to disk (dev)',
      actor: 'dev',
      detail:
        'If commit response includes exportedSpec JSON: npm run write:spec -- /tmp/commit.json ' +
        '(or pipe curl output). Agent mode may auto-write in local dev.',
      verify: ['ls spec/ shows 9 .md files', 'No subdirectories under spec/'],
    },
    {
      id: 'verify-files',
      order: 6,
      label: 'Verify exported content',
      actor: 'dev',
      detail: 'Spot-check INDEX.md table, features.md F-004 section, open-questions.md entry.',
      verify: EXPORT_VERIFICATION_CHECKLIST,
    },
  ],

  cliPath: [
    {
      id: 'cli-intent',
      label: 'Create preview',
      command: `insforge functions invoke nlide-api --data '${buildIntentSmokePayload()}'`,
      expect: [
        'HTTP 200 with preview object',
        'preview.previewId string present',
        'preview.mdPatches non-empty array',
      ],
    },
    {
      id: 'cli-commit',
      label: 'Commit preview (replace PREVIEW_ID)',
      command:
        "insforge functions invoke nlide-api --data '{\"action\":\"commit\",\"previewId\":\"PREVIEW_ID\"}' > /tmp/nlide-commit.json",
      expect: [
        'committed: true',
        'exportedSpec object with 9 keys (Phase 6 Agent mode)',
        'cards and edges arrays match preview',
      ],
    },
    {
      id: 'cli-write',
      label: 'Write exportedSpec to spec/',
      command: 'npm run write:spec -- /tmp/nlide-commit.json',
      expect: ['stdout: wrote spec/INDEX.md … wrote spec/open-questions.md (9 lines)'],
    },
    {
      id: 'cli-verify',
      label: 'List exported tree',
      command: 'ls -1 spec/*.md | wc -l',
      expect: ['9'],
    },
  ],

  diskWriteScript: 'scripts/write-exported-spec.mjs',
  diskWriteUsage: [
    'npm run write:spec -- path/to/commit-response.json',
    'cat commit.json | npm run write:spec',
    'Reads exportedSpec from commit API response (or raw Record<file, content>).',
    'Creates spec/ if missing; overwrites all listed files.',
  ],

  commitSuccessShape:
    '{ "committed": true, "previewId": "...", "cards": [...], "edges": [...], "exportedSpec": { "INDEX.md": "...", ...9 files } }',

  verificationChecklist: EXPORT_VERIFICATION_CHECKLIST,

  stubCommitExpectations: [
    'features.md contains ### F-004: (stub buildPreview / mapCanvasToPreview)',
    'open-questions.md contains domain allowlist question (finalizeStubMdPatches)',
    'INDEX.md contains ## Agent routing rules and Spec files table',
    'All SPEC_FILE_ALLOWLIST files exist even if most are empty scaffolds',
    'Second commit with no mdPatches still rewrites all 9 files (full-tree policy)',
  ],

  failureModes: [
    'commit returns 200 but no exportedSpec — Phase 6 export not wired; fail smoke',
    'exportedSpec missing INDEX.md or has ≠9 keys — assembly bug',
    'validate-spec blocksCommit → commit 4xx; preview row retained; spec/ unchanged',
    'write:spec exits 1 — JSON missing exportedSpec key',
    'Local stub mode (no VITE_INSFORGE_FUNCTION_URL) — canvas works but no Postgres/spec export path',
  ],

  agentModeDeliverables: [
    'commitPreview() applies mdPatches → spec_sections, assembles exportedSpec, validates, then writes cards',
    'Shared helpers: assembleSpecFile(), generateIndexMd() from specFolderLayout.ts',
    'Optional action:export-smoke — headless assemble from fixture spec_sections (no UI)',
    'npm run insforge:invoke:export-smoke — CI-friendly regression',
    'Frontend commit handler: optional auto npm run write:spec in dev via download prompt (stretch)',
  ],

  explicitNonGoals: [
    'Smoke does not require real LLM router/writers on intent — stub preview is enough for v0 path',
    'Smoke does not verify Flow C agent execution — export handoff only',
    'No InsForge Storage upload in smoke — repo spec/ is the assertion target',
    'No auth/login in smoke path',
  ],
}

/** JSON body for intent smoke invoke. */
export function buildIntentSmokePayload(
  message = EXPORT_SMOKE_MESSAGE,
  projectId = '00000000-0000-4000-8000-000000000001',
): string {
  return JSON.stringify({
    action: 'intent',
    message,
    projectId,
  })
}

/** JSON body for commit smoke invoke. */
export function buildCommitSmokePayload(previewId: string): string {
  return JSON.stringify({
    action: 'commit',
    previewId,
  })
}

/** Flatten brief for Agent mode or docs. */
export function formatExportEndToEndSmoke(
  smoke: ExportEndToEndSmoke = EXPORT_END_TO_END_SMOKE,
): string {
  const section = (title: string, lines: string[]) =>
    [`## ${title}`, ...lines.map((l) => `- ${l}`)].join('\n')

  const uiSteps = smoke.manualUiPath
    .sort((a, b) => a.order - b.order)
    .map(
      (step) =>
        `### ${step.order}. ${step.label} (${step.actor})\n${step.detail}` +
        (step.verify?.length ? `\nVerify:\n${step.verify.map((v) => `- ${v}`).join('\n')}` : ''),
    )
    .join('\n\n')

  const cliSteps = smoke.cliPath
    .map(
      (step) =>
        `### ${step.label}\n\`\`\`bash\n${step.command}\n\`\`\`\nExpect:\n${step.expect.map((e) => `- ${e}`).join('\n')}`,
    )
    .join('\n\n')

  return [
    '## Policy',
    smoke.policy,
    '',
    `## Pass bar\n**${smoke.passBar}**`,
    '',
    section('Prerequisites', smoke.prerequisites),
    '',
    '## Manual UI path (primary)',
    uiSteps,
    '',
    '## CLI path (headless)',
    cliSteps,
    '',
    section('Disk write script', [smoke.diskWriteScript, ...smoke.diskWriteUsage]),
    '',
    '## Commit success shape',
    smoke.commitSuccessShape,
    '',
    section('Verification checklist', smoke.verificationChecklist),
    '',
    section('Stub commit expectations', smoke.stubCommitExpectations),
    '',
    section('Failure modes', smoke.failureModes),
    '',
    section('Agent mode deliverables', smoke.agentModeDeliverables),
    '',
    section('Explicit non-goals', smoke.explicitNonGoals),
  ].join('\n')
}
