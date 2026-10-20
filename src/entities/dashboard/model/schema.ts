import { z } from 'zod'

import { widgetSchema } from '@/entities/widget/@x/dashboard'

export const CURRENT_SCHEMA_VERSION = 1

const isoDate = z.iso.date()

export const dashboardSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  id: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  widgets: z.array(widgetSchema).max(100),
  /** Default global date range (the URL can override it). */
  dateRange: z.object({ from: isoDate.optional(), to: isoDate.optional() }).optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type Dashboard = z.infer<typeof dashboardSchema>

/** Migrations from version n to n+1. Empty until the format changes. */
const migrations: Record<number, (doc: Record<string, unknown>) => Record<string, unknown>> = {}

export class DashboardFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DashboardFormatError'
  }
}

/** Validates any JSON as a dashboard, migrating older versions first. */
export function parseDashboard(raw: unknown): Dashboard {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    throw new DashboardFormatError('Not a dashboard object')
  let doc = raw as Record<string, unknown>
  let version = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 0
  if (version > CURRENT_SCHEMA_VERSION)
    throw new DashboardFormatError(`Made with a newer version (schema ${version})`)
  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = migrations[version]
    if (!migrate) throw new DashboardFormatError(`Unsupported schema version ${version}`)
    doc = migrate(doc)
    version++
  }
  const parsed = dashboardSchema.safeParse(doc)
  if (!parsed.success)
    throw new DashboardFormatError(
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    )
  return parsed.data
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
