import { useTranslation } from 'react-i18next'

import {
  findField,
  formatDimensionValue,
  formatMeasureValue,
  type Dataset,
} from '@/entities/dataset/@x/widget'
import { formatNumber, useFormat, type NumberFormatOptions } from '@/shared/lib'
import { useChartTheme, type ChartTheme } from '@/shared/lib/echarts'
import type { ResultColumn } from '@/shared/lib/query-engine'

import { columnLabel } from '../lib/labels'
import type { Series, SeriesData } from '../lib/series'

export function rotate<T>(list: readonly T[], offset: number): T[] {
  const n = list.length
  return list.map((_, i) => list[(i + offset) % n] as T)
}

export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!m) return hex
  return `rgba(${parseInt(m[1] ?? '0', 16)}, ${parseInt(m[2] ?? '0', 16)}, ${parseInt(m[3] ?? '0', 16)}, ${alpha})`
}

/** Labels and formatters shared by all chart renderers. */
export function useChartContext(
  dataset: Dataset | undefined,
  columns: ResultColumn[],
  override: NumberFormatOptions | undefined,
) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const theme = useChartTheme()
  const field = (c: ResultColumn | undefined) =>
    dataset && c ? findField(dataset, c.field) : undefined
  const measures = columns.filter((c) => c.kind === 'measure')
  const m0 = measures[0]

  const label = (c: ResultColumn) => columnLabel(c, dataset, fmt.lang, t)
  const dim = (c: ResultColumn | undefined, v: unknown) =>
    formatDimensionValue(v, field(c), fmt, c?.grain)
  const value = (c: ResultColumn | undefined, v: unknown) =>
    formatMeasureValue(v, field(c), fmt, override, c?.agg)
  const axisValue = (c: ResultColumn | undefined, v: number) => {
    const base = override ?? (c?.agg === 'count' ? {} : (field(c)?.format ?? {}))
    const style = base.style === 'currency' || base.style === 'percent' ? base.style : 'compact'
    const opts: NumberFormatOptions = { ...base, style }
    if (style === 'percent') opts.decimals = 0
    else delete opts.decimals
    return formatNumber(v, fmt, opts)
  }
  const seriesName = (data: SeriesData, s: Series) => {
    if (data.splitBy) return dim(data.splitBy, s.key)
    const col = measures.find((m) => m.id === s.id)
    return col ? label(col) : s.id
  }
  const measureOf = (data: SeriesData, s: Series) =>
    data.splitBy ? m0 : (measures.find((m) => m.id === s.id) ?? m0)

  return { t, fmt, theme, label, dim, value, axisValue, seriesName, measureOf, measures }
}

export function baseOption(theme: ChartTheme, colorOffset: number) {
  return {
    color: rotate(theme.series, colorOffset),
    textStyle: { fontFamily: theme.font, color: theme.text },
    animationDuration: 300,
    aria: { enabled: true },
  }
}

export function tooltip(theme: ChartTheme, trigger: 'axis' | 'item') {
  return {
    trigger,
    backgroundColor: theme.surface,
    borderColor: theme.border,
    textStyle: { color: theme.text, fontFamily: theme.font, fontSize: 12 },
    extraCssText: theme.rtl ? 'direction: rtl; text-align: right;' : '',
    confine: true,
  }
}

export function legend(theme: ChartTheme, show: boolean) {
  return {
    show,
    top: 0,
    [theme.rtl ? 'right' : 'left']: 0,
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 14,
    textStyle: { color: theme.muted, fontFamily: theme.font, fontSize: 12 },
    type: 'scroll' as const,
  }
}

export function categoryAxis(theme: ChartTheme, labels: string[], inverse: boolean) {
  return {
    type: 'category' as const,
    data: labels,
    inverse,
    axisLine: { lineStyle: { color: theme.grid } },
    axisTick: { show: false },
    axisLabel: { color: theme.muted, fontFamily: theme.font, hideOverlap: true },
  }
}

export function valueAxis(
  theme: ChartTheme,
  formatter: (v: number) => string,
  extra: Record<string, unknown> = {},
) {
  return {
    type: 'value' as const,
    splitLine: { lineStyle: { color: theme.grid } },
    axisLabel: { color: theme.muted, fontFamily: theme.font, formatter },
    ...extra,
  }
}
