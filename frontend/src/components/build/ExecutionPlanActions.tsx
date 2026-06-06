interface ExecutionPlanActionsProps {
  summary: string
  onCommit: () => void
  onDiscard: () => void
  isLoading?: boolean
}

export default function ExecutionPlanActions({
  summary,
  onCommit,
  onDiscard,
  isLoading = false,
}: ExecutionPlanActionsProps) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-300">
        Preview — commit or discard
      </p>
      <p className="text-xs text-amber-100">{summary}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isLoading}
          className="soft-button rounded-xl px-3 py-1.5 text-xs text-[#d1d5db] disabled:opacity-50"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onCommit}
          disabled={isLoading}
          className="rounded-xl border border-emerald-300/20 bg-emerald-500/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          Commit plan
        </button>
      </div>
    </div>
  )
}
