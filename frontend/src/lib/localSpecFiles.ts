const localSpecModules = import.meta.glob('../../../spec/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getLocalSpecFile(file: string): string | undefined {
  const entry = Object.entries(localSpecModules).find(([path]) => path.endsWith(`/${file}`))
  return entry?.[1]
}
