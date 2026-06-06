interface SpecFilePanelProps {
  file: string
  content: string
  isLoading: boolean
}

export default function SpecFilePanel({ file, content, isLoading }: SpecFilePanelProps) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-[#9aa3b2]">Markdown file · {file}</div>
      <div className="glass-surface max-h-64 overflow-auto rounded-2xl px-3 py-2">
        {isLoading ? (
          <p className="text-xs text-[#9aa3b2]">Loading spec file…</p>
        ) : content.trim() ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[#c4cad4]">
            {content}
          </pre>
        ) : (
          <p className="text-xs text-[#9aa3b2]">No markdown content for this file yet.</p>
        )}
      </div>
    </div>
  )
}
