import { EChart } from '@/shared/lib/echarts'

import { formatOverride } from '../model/settings'
import { baseOption, categoryAxis, hexToRgba, tooltip, useChartContext } from './chartContext'
import { escapeHtml } from './ScatterChart'
import type { RendererProps } from './types'

const sortValues = (values: unknown[]) =>
  [...values].sort((a, b) =>
    typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)),
  )

/** First dimension on the horizontal axis, second on the vertical axis. */
export function HeatmapChart({
  widget,
  settings: s,
  rows,
  columns,
  dataset,
}: RendererProps<'heatmap'>) {
  const ctx = useChartContext(dataset, columns, formatOverride(s))
  const { theme } = ctx
  const [dx, dy] = columns.filter((c) => c.kind === 'dimension')
  const m = ctx.measures[0]
  const xs = sortValues([...new Set(rows.map((r) => r[dx?.alias ?? '']))])
  const ys = sortValues([...new Set(rows.map((r) => r[dy?.alias ?? '']))])
  const xi = new Map(xs.map((v, i) => [v, i]))
  const yi = new Map(ys.map((v, i) => [v, i]))
  const values = rows.map((r) => Number(r[m?.alias ?? '']))
  const points = rows.map((r) => [
    xi.get(r[dx?.alias ?? '']),
    yi.get(r[dy?.alias ?? '']),
    r[m?.alias ?? ''],
  ])
  const option = {
    ...baseOption(theme, 0),
    tooltip: {
      ...tooltip(theme, 'item'),
      formatter: (p: { value: [number, number, unknown] }) =>
        `${escapeHtml(ctx.dim(dx, xs[p.value[0]]))} · ${escapeHtml(ctx.dim(dy, ys[p.value[1]]))}<br/><b>${escapeHtml(ctx.value(m, p.value[2]))}</b>`,
    },
    grid: { left: 4, right: 8, top: 6, bottom: 2, containLabel: true },
    xAxis: {
      ...categoryAxis(
        theme,
        xs.map((v) => ctx.dim(dx, v)),
        theme.rtl,
      ),
      splitArea: { show: false },
    },
    yAxis: {
      ...categoryAxis(
        theme,
        ys.map((v) => ctx.dim(dy, v)),
        true,
      ),
      position: theme.rtl ? 'right' : 'left',
    },
    visualMap: {
      show: false,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 1,
      inRange: { color: [hexToRgba(theme.accent, 0.08), theme.accent] },
    },
    series: [
      {
        type: 'heatmap' as const,
        data: points,
        itemStyle: { borderColor: theme.surface, borderWidth: 3, borderRadius: 4 },
        label: {
          show: s.showLabels,
          color: theme.text,
          fontSize: 10,
          formatter: (p: { value: [number, number, number] }) => ctx.axisValue(m, p.value[2]),
        },
        emphasis: { itemStyle: { borderColor: theme.text, borderWidth: 1 } },
      },
    ],
  }
  return <EChart option={option} label={widget.title} />
}
