import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface AppDB extends DBSchema {
  /** Dashboard JSON documents. */
  dashboards: { key: string; value: { id: string; updatedAt: string; doc: unknown } }
  /** Metadata of imported datasets. */
  datasets: { key: string; value: { id: string; doc: unknown } }
  /** Raw bytes of imported files (CSV). */
  files: { key: string; value: { id: string; name: string; bytes: Uint8Array } }
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | undefined

export function getStorage(): Promise<IDBPDatabase<AppDB>> {
  dbPromise ??= openDB<AppDB>('dashboard-builder', 1, {
    upgrade(db) {
      db.createObjectStore('dashboards', { keyPath: 'id' })
      db.createObjectStore('datasets', { keyPath: 'id' })
      db.createObjectStore('files', { keyPath: 'id' })
    },
  })
  return dbPromise
}
