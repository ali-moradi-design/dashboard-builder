import type { Dimension, Filter, FilterOp, Measure, QuerySpec } from '@/shared/lib/query-engine'
import type { FieldType } from '@/shared/lib/query-engine'

export interface DraftField {
  name: string
  type: FieldType
}

function nextId(prefix: string, taken: readonly { id: string }[]): string {
  let i = 1
  while (taken.some((x) => x.id === `${prefix}${i}`)) i++
  return `${prefix}${i}`
}

const all = (q: QuerySpec) => [...q.measures, ...q.dimensions]

export function addMeasure(q: QuerySpec, field: DraftField | null): QuerySpec {
  if (q.measures.length >= 6) return q
  const m: Measure =
    field === null
      ? { id: nextId('m', all(q)), agg: 'count' }
      : field.type === 'number'
        ? { id: nextId('m', all(q)), agg: 'sum', field: field.name }
        : { id: nextId('m', all(q)), agg: 'count', field: field.name }
  return { ...q, measures: [...q.measures, m] }
}

export function addDimension(q: QuerySpec, field: DraftField): QuerySpec {
  if (q.dimensions.length >= 2 || q.dimensions.some((d) => d.field === field.name)) return q
  const d: Dimension = {
    id: nextId('d', all(q)),
    field: field.name,
    ...(field.type === 'date' ? { grain: 'month' as const } : {}),
  }
  return { ...q, dimensions: [...q.dimensions, d] }
}

export function defaultFilterOp(type: FieldType): FilterOp {
  return type === 'date' ? 'between' : type === 'number' ? 'gte' : 'eq'
}

export function addFilter(q: QuerySpec, field: DraftField): QuerySpec {
  if (q.filters.length >= 20) return q
  const f: Filter = {
    field: field.name,
    op: defaultFilterOp(field.type),
    ...(field.type === 'boolean' ? { value: true } : {}),
  }
  return { ...q, filters: [...q.filters, f] }
}

export function updateAt<T>(list: readonly T[], index: number, patch: Partial<T>): T[] {
  return list.map((x, i) => (i === index ? { ...x, ...patch } : x))
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index)
}

/** Removes a measure or dimension and any sort that pointed at it. */
export function removeColumn(q: QuerySpec, id: string): QuerySpec {
  return {
    ...q,
    measures: q.measures.filter((m) => m.id !== id),
    dimensions: q.dimensions.filter((d) => d.id !== id),
    sort: q.sort.filter((s) => s.by !== id),
  }
}

/** A filter is complete when it has the values its operator needs. */
export function isCompleteFilter(f: Filter): boolean {
  if (f.op === 'isNull' || f.op === 'notNull') return true
  if (f.op === 'between')
    return Array.isArray(f.value) && f.value.length === 2 && f.value.every((v) => v !== '')
  if (f.op === 'in' || f.op === 'notIn') return Array.isArray(f.value) && f.value.length > 0
  return (
    f.value !== undefined &&
    f.value !== '' &&
    !(typeof f.value === 'number' && Number.isNaN(f.value))
  )
}

/** The query without half-filled filters, ready to run. */
export function runnable(q: QuerySpec): QuerySpec {
  return { ...q, filters: q.filters.filter(isCompleteFilter) }
}
