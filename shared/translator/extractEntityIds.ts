/** Extract stable entity IDs (F-001, T-002, D-003, OQ-004) from markdown section headings. */
export function extractEntityIds(content: string, prefix: string): string[] {
  const pattern = new RegExp(`### (${prefix}-\\d{3}):`, 'g')
  const ids: string[] = []
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    ids.push(match[1])
  }
  return ids
}

/** Parse task ID → title from tasks.md headings. */
export function parseTaskTitles(tasksMd: string): Map<string, string> {
  const titles = new Map<string, string>()
  const pattern = /### (T-\d{3}): (.+)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(tasksMd)) !== null) {
    titles.set(match[1], match[2].trim())
  }
  return titles
}
