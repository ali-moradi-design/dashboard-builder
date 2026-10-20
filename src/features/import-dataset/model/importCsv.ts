import { fieldTypeFromDuckDB, type Dataset } from '@/entities/dataset'
import { describeTable, dropTable, ensureCsvTable, runQuery } from '@/shared/lib/duckdb'
import { quoteIdent } from '@/shared/lib/query-engine'

export const MAX_CSV_BYTES = 50 * 1024 * 1024

function slug(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'data'
  )
}

/**
 * Loads a CSV file into DuckDB in the browser and builds a dataset definition
 * from the detected columns. The file never leaves the browser.
 */
export async function importCsv(file: File): Promise<{ dataset: Dataset; bytes: Uint8Array }> {
  if (file.size > MAX_CSV_BYTES) throw new Error('tooLarge')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const id = `csv_${slug(file.name)}_${Date.now().toString(36)}`
  await ensureCsvTable(id, () => Promise.resolve(bytes))
  try {
    const columns = await describeTable(id)
    if (columns.length === 0) throw new Error('empty')
    const { rows } = await runQuery(`SELECT count(*)::INTEGER AS n FROM ${quoteIdent(id)}`)
    const fields = columns.map((c) => ({
      name: c.name,
      type: fieldTypeFromDuckDB(c.type),
      label: { en: c.name },
    }))
    const dataset: Dataset = {
      id,
      builtIn: false,
      table: id,
      label: { en: file.name.replace(/\.[^.]+$/, '') },
      source: { kind: 'csv', fileId: id, fileName: file.name },
      fields,
      dateField: fields.find((f) => f.type === 'date')?.name,
      rowCount: Number(rows[0]?.n ?? 0),
    }
    return { dataset, bytes }
  } catch (e) {
    await dropTable(id)
    throw e
  }
}
