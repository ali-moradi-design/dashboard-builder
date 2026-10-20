import { DuckDBDataProtocol } from '@duckdb/duckdb-wasm'

import { quoteIdent } from '../query-engine'

import { execute, getDuckDB, runQuery } from './client'

const loaded = new Map<string, Promise<void>>()

/** Makes a Parquet file available as a view. Loaded once per table name. */
export function ensureParquetView(table: string, url: string): Promise<void> {
  let p = loaded.get(table)
  if (!p) {
    p = (async () => {
      const db = await getDuckDB()
      const file = `${table}.parquet`
      const absolute = new URL(url, window.location.href).href
      await db.registerFileURL(file, absolute, DuckDBDataProtocol.HTTP, false)
      await execute(
        `CREATE OR REPLACE VIEW ${quoteIdent(table)} AS SELECT * FROM read_parquet('${file}')`,
      )
    })()
    p.catch(() => loaded.delete(table))
    loaded.set(table, p)
  }
  return p
}

/** Loads CSV bytes into a table (types detected by DuckDB). */
export function ensureCsvTable(table: string, bytes: () => Promise<Uint8Array>): Promise<void> {
  let p = loaded.get(table)
  if (!p) {
    p = (async () => {
      const db = await getDuckDB()
      const file = `${table}.csv`
      // DuckDB transfers the buffer to its worker, so give it a copy.
      await db.registerFileBuffer(file, (await bytes()).slice())
      await execute(
        `CREATE OR REPLACE TABLE ${quoteIdent(table)} AS SELECT * FROM read_csv_auto('${file}', header = true, sample_size = 20000)`,
      )
    })()
    p.catch(() => loaded.delete(table))
    loaded.set(table, p)
  }
  return p
}

export async function dropTable(table: string): Promise<void> {
  loaded.delete(table)
  await execute(`DROP TABLE IF EXISTS ${quoteIdent(table)}`)
}

export interface ColumnInfo {
  name: string
  /** DuckDB type name, e.g. `BIGINT`, `VARCHAR`, `DATE`. */
  type: string
}

export async function describeTable(table: string): Promise<ColumnInfo[]> {
  const { rows } = await runQuery(`DESCRIBE ${quoteIdent(table)}`)
  return rows.map((r) => ({ name: String(r.column_name), type: String(r.column_type) }))
}
