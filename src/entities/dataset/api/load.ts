import { ensureCsvTable, ensureParquetView } from '@/shared/lib/duckdb'
import { getStorage } from '@/shared/lib/storage'

import type { Dataset } from '../model/types'

/** Makes the dataset's table available in DuckDB (once). */
export function ensureDatasetLoaded(dataset: Dataset): Promise<void> {
  const source = dataset.source
  if (source.kind === 'parquet') return ensureParquetView(dataset.table, source.url)
  return ensureCsvTable(dataset.table, async () => {
    const db = await getStorage()
    const file = await db.get('files', source.fileId)
    if (!file) throw new Error(`File for dataset "${dataset.id}" is missing`)
    return file.bytes
  })
}
