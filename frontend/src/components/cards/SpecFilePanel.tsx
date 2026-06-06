interface SpecFilePanelProps {
  file: string
  anchor?: string
  committedSection: string
  proposedSection?: string
  hasPreview: boolean
  isLoading: boolean
}

function SectionBlock({
  label,
  content,
  variant,
}: {
  label: string
  content: string
  variant: 'current' | 'proposed'
}) {
  const isProposed = variant === 'proposed'

  return (
    <div className={isProposed ? 'mt-3' : undefined}>
      <div
        className={
          isProposed
            ? 'mb-1 text-[10px] font-semibold uppercase tracking-wide text-sky-300/90'
            : 'mb-1 text-[10px] font-medium uppercase tracking-wide text-[#9aa3b2]'
        }
      >
        {label}
      </div>
      <div
        className={
          isProposed
            ? 'glass-surface max-h-48 overflow-auto rounded-2xl border border-sky-300/25 bg-sky-500/8 px-3 py-2'
            : 'glass-surface max-h-48 overflow-auto rounded-2xl px-3 py-2'
        }
      >
        <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[#c4cad4]">
          {content}
        </pre>
      </div>
    </div>
  )
}

export default function SpecFilePanel({
  file,
  anchor,
  committedSection,
  proposedSection,
  hasPreview,
  isLoading,
}: SpecFilePanelProps) {
  const title = anchor ? `Markdown · ${file} · ${anchor}` : `Markdown file · ${file}`

  return (
    <div>
      <div className="mb-2 text-xs font-medium text-[#9aa3b2]">{title}</div>

      {isLoading ? (
        <div className="glass-surface max-h-64 overflow-auto rounded-2xl px-3 py-2">
          <p className="text-xs text-[#9aa3b2]">Loading spec file…</p>
        </div>
      ) : committedSection.trim() ? (
        <>
          <SectionBlock label="Current" content={committedSection} variant="current" />
          {hasPreview && proposedSection?.trim() ? (
            <SectionBlock label="Proposed (preview)" content={proposedSection} variant="proposed" />
          ) : null}
        </>
      ) : (
        <div className="glass-surface max-h-64 overflow-auto rounded-2xl px-3 py-2">
          <p className="text-xs text-[#9aa3b2]">No markdown content for this file yet.</p>
        </div>
      )}
    </div>
  )
}
