import {
  formatDate,
  formatNumber,
  intlLocale,
  type FormatContext,
  type NumberFormatOptions,
} from '@/shared/lib'
import type { DateGrain } from '@/shared/lib/query-engine'

import type { DatasetField } from '../model/types'

function parseIsoDate(v: string): Date | undefined {
  const d = new Date(v.length === 10 ? v + 'T00:00:00Z' : v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** Formats a dimension value (date by grain, weekday/hour names, numbers, text). */
export function formatDimensionValue(
  value: unknown,
  field: DatasetField | undefined,
  ctx: FormatContext,
  grain?: DateGrain,
): string {
  if (value === null || value === undefined) return '–'
  if (field?.type === 'date' && typeof value === 'string') {
    const d = parseIsoDate(value)
    if (!d) return value
    return formatDate(d, ctx, grain === 'week' ? 'day' : (grain ?? 'day'))
  }
  if (field?.display === 'weekday' && typeof value === 'number') {
    // 2024-01-01 was a Monday (ISO weekday 1).
    return new Intl.DateTimeFormat(intlLocale(ctx), { weekday: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2024, 0, value)),
    )
  }
  if (field?.display === 'hour' && typeof value === 'number') {
    const zero = ctx.lang === 'fa' && ctx.digits === 'native' ? '۰' : '0'
    return formatNumber(value, ctx, { decimals: 0 }).padStart(2, zero) + ':' + zero + zero
  }
  if (typeof value === 'number') return formatNumber(value, ctx, field?.format ?? { decimals: 2 })
  if (typeof value === 'boolean') return value ? '✓' : '✗'
  return typeof value === 'string' ? value : JSON.stringify(value)
}

/** Formats a measure value; `override` wins over the field's own format. */
export function formatMeasureValue(
  value: unknown,
  field: DatasetField | undefined,
  ctx: FormatContext,
  override?: NumberFormatOptions,
  agg?: string,
): string {
  if (value === null || value === undefined) return '–'
  const base = agg === 'count' ? { decimals: 0 } : (field?.format ?? {})
  return formatNumber(Number(value), ctx, override ?? base)
}
