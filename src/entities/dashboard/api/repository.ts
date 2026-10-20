import { getStorage } from '@/shared/lib/storage'

import { sampleDashboard } from '../config/sample'
import { parseDashboard, type Dashboard } from '../model/schema'

const SEED_KEY = 'db-seeded-v1'

async function seedOnce(): Promise<void> {
  let seeded = false
  try {
    seeded = localStorage.getItem(SEED_KEY) === '1'
  } catch {
    // Storage blocked: seed every session.
  }
  if (seeded) return
  const db = await getStorage()
  if ((await db.count('dashboards')) === 0) {
    await db.put('dashboards', {
      id: sampleDashboard.id,
      updatedAt: sampleDashboard.updatedAt,
      doc: sampleDashboard,
    })
  }
  try {
    localStorage.setItem(SEED_KEY, '1')
  } catch {
    // ignore
  }
}

export async function listDashboards(): Promise<Dashboard[]> {
  await seedOnce()
  const db = await getStorage()
  const rows = await db.getAll('dashboards')
  const out: Dashboard[] = []
  for (const r of rows) {
    try {
      out.push(parseDashboard(r.doc))
    } catch {
      // Skip a broken record instead of breaking the list.
    }
  }
  return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getDashboard(id: string): Promise<Dashboard | null> {
  await seedOnce()
  const db = await getStorage()
  const row = await db.get('dashboards', id)
  if (row) return parseDashboard(row.doc)
  // The sample can always be opened, even after it was deleted.
  return id === sampleDashboard.id ? sampleDashboard : null
}

export async function saveDashboard(dashboard: Dashboard): Promise<Dashboard> {
  const doc = parseDashboard({ ...dashboard, updatedAt: new Date().toISOString() })
  const db = await getStorage()
  await db.put('dashboards', { id: doc.id, updatedAt: doc.updatedAt, doc })
  return doc
}

export async function deleteDashboard(id: string): Promise<void> {
  const db = await getStorage()
  await db.delete('dashboards', id)
}
