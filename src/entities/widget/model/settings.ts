import { z } from 'zod'

import type { NumberFormatOptions, NumberStyle } from '@/shared/lib'

import type { WidgetType } from './types'

const bool = (v: boolean) => z.boolean().catch(v)
const numberFormat = z.enum(['auto', 'number', 'compact', 'currency', 'percent']).catch('auto')
const decimals = z.number().int().min(0).max(6).optional().catch(undefined)
const colorOffset = z.coerce.number().int().min(0).max(4).catch(0)

const chartBase = {
  format: numberFormat,
  decimals,
  showLegend: bool(true),
  showLabels: bool(false),
  colorOffset,
}

/** Settings per widget type. Every key has a default, so old or broken values never crash a widget. */
export const settingsSchemas = {
  kpi: z.object({
    format: numberFormat,
    decimals,
    showDelta: bool(true),
    showSparkline: bool(true),
  }),
  line: z.object({
    ...chartBase,
    smooth: bool(false),
    showPoints: bool(true),
    fillArea: bool(false),
  }),
  area: z.object({ ...chartBase, smooth: bool(true), stacked: bool(false) }),
  bar: z.object({ ...chartBase, horizontal: bool(false) }),
  stackedBar: z.object({ ...chartBase, horizontal: bool(false) }),
  pie: z.object({ ...chartBase, donut: bool(true) }),
  scatter: z.object({ ...chartBase, pointSize: z.coerce.number().int().min(2).max(20).catch(6) }),
  heatmap: z.object({ format: numberFormat, decimals, showLabels: bool(false) }),
  table: z.object({
    format: numberFormat,
    decimals,
    pageSize: z.coerce.number().int().min(3).max(100).catch(10),
  }),
  heading: z.object({
    subtitle: z.string().max(300).catch(''),
    align: z.enum(['start', 'center']).catch('start'),
  }),
  text: z.object({ content: z.string().max(5000).catch('') }),
} satisfies Record<WidgetType, z.ZodType>

export type WidgetSettings<T extends WidgetType> = z.infer<(typeof settingsSchemas)[T]>

export function parseSettings<T extends WidgetType>(type: T, raw: unknown): WidgetSettings<T> {
  return settingsSchemas[type].parse(raw ?? {}) as WidgetSettings<T>
}

/** Turns the format setting into number format options ("auto" uses the field's format). */
export function formatOverride(s: {
  format: string
  decimals?: number | undefined
}): NumberFormatOptions | undefined {
  if (s.format === 'auto') return s.decimals === undefined ? undefined : { decimals: s.decimals }
  const opts: NumberFormatOptions = { style: s.format as NumberStyle }
  if (s.format === 'currency') opts.currency = 'EUR'
  if (s.decimals !== undefined) opts.decimals = s.decimals
  return opts
}
