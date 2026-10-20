import type { NumberFormatOptions } from '@/shared/lib'
import type { LocalizedText } from '@/shared/lib/localized'
import type { DatasetSchema, FieldType } from '@/shared/lib/query-engine'

export interface DatasetField {
  name: string
  type: FieldType
  label: LocalizedText
  /** How values of this field are shown. */
  format?: NumberFormatOptions | undefined
}

export type DatasetSource =
  { kind: 'parquet'; url: string } | { kind: 'csv'; fileId: string; fileName: string }

export interface Dataset {
  id: string
  label: LocalizedText
  description?: LocalizedText | undefined
  /** DuckDB table or view name. */
  table: string
  source: DatasetSource
  fields: DatasetField[]
  /** Field the global date-range filter applies to. */
  dateField?: string | undefined
  rowCount?: number | undefined
  builtIn: boolean
}

export function toQuerySchema(dataset: Dataset): DatasetSchema {
  return {
    table: dataset.table,
    dateField: dataset.dateField,
    fields: dataset.fields.map((f) => ({ name: f.name, type: f.type })),
  }
}

export function findField(dataset: Dataset, name: string | undefined): DatasetField | undefined {
  return name === undefined ? undefined : dataset.fields.find((f) => f.name === name)
}

/** Maps a DuckDB column type to the engine's field type. */
export function fieldTypeFromDuckDB(type: string): FieldType {
  const t = type.toUpperCase()
  if (t === 'BOOLEAN') return 'boolean'
  if (t === 'DATE' || t.startsWith('TIMESTAMP')) return 'date'
  if (
    /^(TINYINT|SMALLINT|INTEGER|BIGINT|HUGEINT|UTINYINT|USMALLINT|UINTEGER|UBIGINT|FLOAT|REAL|DOUBLE|DECIMAL)/.test(
      t,
    )
  )
    return 'number'
  return 'string'
}
