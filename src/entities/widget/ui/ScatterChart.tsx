import { EChart } from '@/shared/lib/echarts'

import { formatOverride } from '../model/settings'
import { baseOption, legend, tooltip, useChartContext, valueAxis } from './chartContext'
import type { RendererProps } from './types'

/** Each row is a point: first dimension names it, second (optional) colors it. */
export function ScatterChart({
  widget,
  settings: s,
  rows,
  columns,
  dataset,
}: RendererProps<'scatter'>) {
  const ctx = useChartContext(dataset, columns, formatOverride(s))
  const { theme } = ctx
  const dims = columns.filter((c) => c.kind === 'dimension')
  const [mx, my] = ctx.measures
  const [point, group] = dims
  const groups = group ? [...new Set(rows.map((r) => r[group.alias]))] : [null]
  const series = groups.map((g) => ({
    type: 'scatter' as const,
    name: group ? ctx.dim(group, g) : my ? ctx.label(my) : '',
    symbolSize: s.pointSize,
    itemStyle: { opacity: 0.85, borderColor: theme.surface, borderWidth: 1 },
    data: rows
      .filter((r) => !group || r[group.alias] === g)
      .map((r) => ({
        value: [r[mx?.alias ?? ''], r[my?.alias ?? '']],
        name: ctx.dim(point, point ? r[point.alias] : null),
      })),
  }))
  const showLegend = s.showLegend && groups.length > 1
  const option = {
    ...baseOption(theme, s.colorOffset),
    legend: legend(theme, showLegend),
    tooltip: {
      ...tooltip(theme, 'item'),
      formatter: (p: { name: string; value: [unknown, unknown]; seriesName: string }) =>
        [
          `<b>${escapeHtml(p.name)}</b>`,
          group ? escapeHtml(p.seriesName) : '',
          `${escapeHtml(mx ? ctx.label(mx) : '')}: ${escapeHtml(ctx.value(mx, p.value[0]))}`,
          `${escapeHtml(my ? ctx.label(my) : '')}: ${escapeHtml(ctx.value(my, p.value[1]))}`,
        ]
          .filter(Boolean)
          .join('<br/>'),
    },
    grid: { left: 4, right: 16, top: showLegend ? 30 : 10, bottom: 24, containLabel: true },
    xAxis: valueAxis(theme, (v) => ctx.axisValue(mx, v), {
      inverse: theme.rtl,
      name: mx ? ctx.label(mx) : '',
      nameLocation: 'middle',
      nameGap: 26,
      nameTextStyle: { color: theme.muted, fontFamily: theme.font },
      scale: true,
    }),
    yAxis: valueAxis(theme, (v) => ctx.axisValue(my, v), {
      position: theme.rtl ? 'right' : 'left',
      scale: true,
    }),
    series,
  }
  return <EChart option={option} label={widget.title} />
}

/** ECharts tooltips are HTML; data values must be escaped. */
export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )
}
