import { newId, parseDashboard, type Dashboard } from '@/entities/dashboard'

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024

function slug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'dashboard'
  )
}

/** Downloads the dashboard as a JSON file (this is how dashboards are shared). */
export function exportDashboard(dashboard: Dashboard): void {
  const blob = new Blob([JSON.stringify(dashboard, null, 2) + '\n'], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug(dashboard.title)}.dashboard.json`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Reads and validates a dashboard JSON file. Imports never overwrite: a
 * dashboard whose id already exists gets a new id.
 */
export async function readDashboardFile(
  file: File,
  existingIds: ReadonlySet<string>,
): Promise<Dashboard> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('tooLarge')
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    throw new Error('notJson')
  }
  const d = parseDashboard(raw)
  const now = new Date().toISOString()
  return { ...d, id: existingIds.has(d.id) ? newId('dash') : d.id, updatedAt: now }
}
