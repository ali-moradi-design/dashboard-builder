import { create } from 'zustand'

import { getStorage } from '@/shared/lib/storage'

import { sampleDatasets } from '../config/samples'
import type { Dataset } from './types'

interface DatasetsState {
  imported: Dataset[]
  ready: boolean
  load: () => Promise<void>
  add: (dataset: Dataset, bytes: Uint8Array) => Promise<void>
  remove: (id: string) => Promise<void>
}

/** Built-in samples plus datasets the user imported (kept in IndexedDB). */
export const useDatasetsStore = create<DatasetsState>()((set, get) => ({
  imported: [],
  ready: false,
  load: async () => {
    if (get().ready) return
    try {
      const db = await getStorage()
      const rows = await db.getAll('datasets')
      set({ imported: rows.map((r) => r.doc as Dataset), ready: true })
    } catch {
      set({ ready: true })
    }
  },
  add: async (dataset, bytes) => {
    if (dataset.source.kind !== 'csv') throw new Error('Only CSV datasets can be imported')
    const db = await getStorage()
    const tx = db.transaction(['datasets', 'files'], 'readwrite')
    await tx
      .objectStore('files')
      .put({ id: dataset.source.fileId, name: dataset.source.fileName, bytes })
    await tx.objectStore('datasets').put({ id: dataset.id, doc: dataset })
    await tx.done
    set((s) => ({ imported: [...s.imported.filter((d) => d.id !== dataset.id), dataset] }))
  },
  remove: async (id) => {
    const dataset = get().imported.find((d) => d.id === id)
    const db = await getStorage()
    await db.delete('datasets', id)
    if (dataset?.source.kind === 'csv') await db.delete('files', dataset.source.fileId)
    set((s) => ({ imported: s.imported.filter((d) => d.id !== id) }))
  },
}))

export function useDatasets(): readonly Dataset[] {
  const imported = useDatasetsStore((s) => s.imported)
  return [...sampleDatasets, ...imported]
}

export function getDataset(id: string): Dataset | undefined {
  return (
    sampleDatasets.find((d) => d.id === id) ??
    useDatasetsStore.getState().imported.find((d) => d.id === id)
  )
}

export function useDataset(id: string | undefined): Dataset | undefined {
  const imported = useDatasetsStore((s) => s.imported)
  if (id === undefined) return undefined
  return sampleDatasets.find((d) => d.id === id) ?? imported.find((d) => d.id === id)
}
