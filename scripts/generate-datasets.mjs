// Generates the two built-in sample datasets as Parquet files in public/data.
// The data is synthetic and deterministic (hash-based pseudo-random numbers), so
// re-running the script produces the same files.
//
// Usage: node scripts/generate-datasets.mjs
import { createDuckDB, NODE_RUNTIME, VoidLogger } from '@duckdb/duckdb-wasm/blocking'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const dist = dirname(require.resolve('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm'))
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')

const db = await createDuckDB(
  {
    mvp: { mainModule: join(dist, 'duckdb-mvp.wasm'), mainWorker: '' },
    eh: { mainModule: join(dist, 'duckdb-eh.wasm'), mainWorker: '' },
  },
  new VoidLogger(),
  NODE_RUNTIME,
)
await db.instantiate()
const conn = db.connect()

// u(i, k): uniform number in [0, 1) for row i and stream k.
conn.query(`CREATE MACRO u(i, k) AS (hash(i * 7919 + k * 104729) % 1000000) / 1000000.0`)

conn.query(`
CREATE TABLE orders AS
WITH params AS (
  SELECT
    ['Technology', 'Furniture', 'Office supplies', 'Accessories'] AS cats,
    [
      ['Laptop 14"', '4K monitor 27"', 'Noise-cancel headset', 'Webcam HD', 'Docking station'],
      ['Standing desk', 'Ergonomic chair', 'Bookshelf', 'Filing cabinet', 'Meeting table'],
      ['Paper (5 reams)', 'Gel pens (12)', 'Notebook A5', 'Stapler', 'Label printer'],
      ['Desk lamp', 'Monitor arm', 'Cable organizer', 'Mouse pad', 'Laptop stand']
    ] AS products,
    [
      [1150.0, 349.0, 150.0, 79.0, 189.0],
      [452.0, 350.0, 129.0, 189.0, 640.0],
      [24.0, 9.5, 6.0, 14.0, 89.0],
      [40.0, 95.0, 18.0, 12.0, 45.0]
    ] AS prices
),
raw AS (
  SELECT
    i,
    DATE '2023-01-01' + CAST(floor(pow(u(i, 1), 0.82) * 1096) AS INTEGER) AS d,
    u(i, 2) AS u2, u(i, 3) AS u3, u(i, 4) AS u4, u(i, 5) AS u5, u(i, 6) AS u6,
    u(i, 7) AS u7, u(i, 8) AS u8, u(i, 9) AS u9, u(i, 10) AS u10, u(i, 11) AS u11
  FROM range(72000) t(i)
),
shaped AS (
  SELECT
    raw.*,
    CASE WHEN u4 < 0.31 THEN 'Germany' WHEN u4 < 0.55 THEN 'France' WHEN u4 < 0.72 THEN 'Spain'
         WHEN u4 < 0.85 THEN 'Italy' WHEN u4 < 0.94 THEN 'Netherlands' ELSE 'Austria' END AS country,
    CASE WHEN u5 < 0.38 THEN 1 WHEN u5 < 0.67 THEN 2 WHEN u5 < 0.88 THEN 3 ELSE 4 END AS cat_idx,
    1 + CAST(floor(u6 * 5) AS INTEGER) AS prod_idx,
    CASE WHEN u2 < 0.22 THEN 18 + CAST(floor(u11 * 5) AS INTEGER)
         ELSE 8 + CAST(floor(pow(u11, 0.9) * 10) AS INTEGER) END AS hour
  FROM raw
  -- Fewer orders at weekends.
  WHERE NOT (dayofweek(d) IN (0, 6) AND u3 < 0.5)
)
SELECT
  CAST(row_number() OVER (ORDER BY d, i) AS INTEGER) AS order_id,
  d AS order_date,
  CAST(isodow(d) AS INTEGER) AS order_weekday,
  CAST(hour AS INTEGER) AS order_hour,
  country,
  CASE WHEN u10 < 0.52 THEN 'Consumer' WHEN u10 < 0.83 THEN 'Corporate' ELSE 'Home office' END AS segment,
  params.cats[cat_idx] AS category,
  params.products[cat_idx][prod_idx] AS product,
  CAST(1 + floor(pow(u7, 2) * 6) AS INTEGER) AS quantity,
  CAST(params.prices[cat_idx][prod_idx] AS DOUBLE) AS unit_price,
  CASE WHEN u8 < 0.55 THEN 0.0 ELSE round((1 + floor((u8 - 0.55) / 0.45 * 7)) * 0.05, 2) END AS discount
FROM shaped, params
`)
conn.query(`
CREATE TABLE orders_final AS
SELECT
  * EXCLUDE (unit_price),
  unit_price,
  round(quantity * unit_price * (1 - discount), 2) AS revenue,
  round(quantity * unit_price * (1 - discount) * (0.30 - discount * 1.05 + (u(order_id, 12) - 0.5) * 0.14), 2) AS profit
FROM orders
ORDER BY order_id
`)

conn.query(`
CREATE TABLE weather AS
WITH cities AS (
  SELECT * FROM (VALUES
    ('Berlin', 'Germany', 9.9, 9.8, 0.30),
    ('Hamburg', 'Germany', 9.6, 8.6, 0.38),
    ('Paris', 'France', 12.4, 8.2, 0.31),
    ('Madrid', 'Spain', 15.0, 10.5, 0.17),
    ('Rome', 'Italy', 15.6, 8.9, 0.22),
    ('Amsterdam', 'Netherlands', 10.5, 7.2, 0.40),
    ('Vienna', 'Austria', 11.0, 10.3, 0.29),
    ('Tehran', 'Iran', 17.6, 13.0, 0.09),
    ('Lisbon', 'Portugal', 17.4, 6.0, 0.20),
    ('Stockholm', 'Sweden', 7.5, 10.2, 0.33)
  ) AS c(city, country, base, amp, wet)
),
days AS (SELECT CAST(DATE '2023-01-01' + CAST(i AS INTEGER) AS DATE) AS d, i FROM range(1096) t(i))
SELECT
  d AS date,
  city,
  country,
  round(base + amp * sin(2 * pi() * (dayofyear(d) - 110) / 365.0) + (u(i * 13 + ci, 1) - 0.5) * 6, 1) AS temp_avg,
  round(base + amp * sin(2 * pi() * (dayofyear(d) - 110) / 365.0) - 4 - u(i * 13 + ci, 2) * 3, 1) AS temp_min,
  round(base + amp * sin(2 * pi() * (dayofyear(d) - 110) / 365.0) + 4 + u(i * 13 + ci, 3) * 3, 1) AS temp_max,
  CASE WHEN u(i * 13 + ci, 4) < wet THEN round(0.2 + pow(u(i * 13 + ci, 5), 2) * 24, 1) ELSE 0.0 END AS precipitation_mm,
  CAST(round(55 + wet * 60 + (u(i * 13 + ci, 6) - 0.5) * 30) AS INTEGER) AS humidity,
  round(6 + u(i * 13 + ci, 7) * 22, 1) AS wind_kmh
FROM days, (SELECT *, row_number() OVER () AS ci FROM cities)
ORDER BY d, city
`)

mkdirSync(out, { recursive: true })
for (const [table, file] of [
  ['orders_final', 'orders.parquet'],
  ['weather', 'weather.parquet'],
]) {
  conn.query(`COPY ${table} TO '${file}' (FORMAT parquet, COMPRESSION zstd, ROW_GROUP_SIZE 65536)`)
  const buf = db.copyFileToBuffer(file)
  writeFileSync(join(out, file), buf)
  const rows = conn.query(`SELECT count(*)::INTEGER AS n FROM ${table}`).toArray()[0].n
  console.log(`${file}: ${rows} rows, ${(buf.byteLength / 1024).toFixed(0)} KB`)
}
conn.close()
