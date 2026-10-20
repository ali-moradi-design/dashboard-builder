import { TrendingDown, TrendingUp } from 'lucide-react'

import { formatNumber } from '@/shared/lib'
import { EChart } from '@/shared/lib/echarts'

import { formatOverride } from '../model/settings'
import { useChartContext } from './chartContext'
import type { RendererProps } from './types'

/** One measure. With a date dimension: the latest value, change vs. the previous period and a sparkline. */
export function KpiCard({ widget, settings: s, rows, columns, dataset }: RendererProps<'kpi'>) {
  const ctx = useChartContext(dataset, columns, formatOverride(s))
  const { theme, t, fmt } = ctx
  const m = ctx.measures[0]
  const dim = columns.find((c) => c.kind === 'dimension')
  const ordered = dim
    ? [...rows].sort((a, b) => String(a[dim.alias]).localeCompare(String(b[dim.alias])))
    : rows
  const values = ordered.map((r) => (r[m?.alias ?? ''] === null ? null : Number(r[m?.alias ?? ''])))
  const current = values.at(-1) ?? null
  const previous = dim && values.length > 1 ? (values.at(-2) ?? null) : null
  const delta =
    current !== null && previous !== null && previous !== 0
      ? (current - previous) / Math.abs(previous)
      : null
  const up = delta !== null && delta >= 0

  const spark = {
    animation: false,
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: {
      type: 'category' as const,
      show: false,
      inverse: theme.rtl,
      data: values.map((_, i) => i),
    },
    yAxis: { type: 'value' as const, show: false, scale: true },
    series: [
      {
        type: 'line' as const,
        data: values,
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2, color: theme.series[0] },
        areaStyle: { color: theme.series[0], opacity: 0.12 },
      },
    ],
    tooltip: { show: false },
  }

  return (
    <div className="flex h-full min-h-0 flex-col justify-between gap-1">
      <div>
        <div className="text-[28px] leading-tight font-bold tracking-tight" data-testid="kpi-value">
          <bdi dir="ltr">{ctx.value(m, current)}</bdi>
        </div>
        {s.showDelta && delta !== null && dim?.grain && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <span
              className={
                up
                  ? 'inline-flex items-center gap-1 font-semibold text-accent'
                  : 'inline-flex items-center gap-1 font-semibold text-danger'
              }
            >
              {up ? (
                <TrendingUp className="size-3.5" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden />
              )}
              <bdi dir="ltr">
                {(up ? '+' : '') + formatNumber(delta, fmt, { style: 'percent', decimals: 1 })}
              </bdi>
            </span>
            <span>{t('kpi.vsPrevious', { period: t(`grain.${dim.grain}`) })}</span>
          </div>
        )}
      </div>
      {s.showSparkline && dim && values.length > 1 && (
        <div className="h-10 min-h-0 flex-1">
          <EChart option={spark} label={widget.title} />
        </div>
      )}
    </div>
  )
}
