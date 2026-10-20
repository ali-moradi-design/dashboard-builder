import { formatNumber } from '@/shared/lib'
import { EChart } from '@/shared/lib/echarts'

import { toSeries } from '../lib/series'
import { formatOverride } from '../model/settings'
import { baseOption, tooltip, useChartContext } from './chartContext'
import type { RendererProps } from './types'

export function PieChart({ widget, settings: s, rows, columns, dataset }: RendererProps<'pie'>) {
  const ctx = useChartContext(dataset, columns, formatOverride(s))
  const { theme } = ctx
  const data = toSeries(rows, columns)
  const m = ctx.measures[0]
  const values = data.series[0]?.values ?? []
  const items = data.categories.map((c, i) => ({
    name: ctx.dim(data.category, c),
    value: values[i] ?? 0,
  }))
  const option = {
    ...baseOption(theme, s.colorOffset),
    tooltip: { ...tooltip(theme, 'item'), valueFormatter: (v: unknown) => ctx.value(m, v) },
    legend: {
      show: s.showLegend,
      orient: 'vertical' as const,
      [theme.rtl ? 'left' : 'right']: 0,
      top: 'middle',
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.text, fontFamily: theme.font, fontSize: 12 },
      type: 'scroll' as const,
    },
    series: [
      {
        type: 'pie' as const,
        radius: s.donut ? ['50%', '78%'] : ['0%', '78%'],
        center: [s.showLegend ? (theme.rtl ? '64%' : '36%') : '50%', '50%'],
        data: items,
        clockwise: !theme.rtl,
        avoidLabelOverlap: true,
        itemStyle: { borderColor: theme.surface, borderWidth: 2 },
        label: {
          show: s.showLabels,
          color: theme.text,
          formatter: (p: { percent: number }) =>
            formatNumber(p.percent / 100, ctx.fmt, { style: 'percent', decimals: 0 }),
        },
        labelLine: { show: s.showLabels },
      },
    ],
  }
  // Narrow cards: legend below the chart instead of beside it.
  const responsive = {
    baseOption: option,
    media: [
      {
        query: { maxWidth: 440 },
        option: {
          legend: {
            orient: 'horizontal' as const,
            type: 'plain' as const,
            top: 'auto',
            bottom: 0,
            left: 'center',
            right: 'auto',
            textStyle: { color: theme.text, fontFamily: theme.font, fontSize: 12 },
          },
          series: [{ center: ['50%', '44%'], radius: s.donut ? ['40%', '66%'] : ['0%', '66%'] }],
        },
      },
    ],
  }
  return <EChart option={responsive} label={widget.title} />
}
