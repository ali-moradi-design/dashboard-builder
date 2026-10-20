import { EChart } from '@/shared/lib/echarts'

import { toSeries } from '../lib/series'
import { formatOverride, type WidgetSettings } from '../model/settings'
import {
  baseOption,
  categoryAxis,
  legend,
  tooltip,
  useChartContext,
  valueAxis,
} from './chartContext'
import type { RendererProps } from './types'

type CartesianType = 'line' | 'area' | 'bar' | 'stackedBar'

/** Line, area, bar and stacked bar charts share one category/value layout. */
export function CartesianChart({
  widget,
  settings,
  rows,
  columns,
  dataset,
}: RendererProps<CartesianType>) {
  const type = widget.type as CartesianType
  const s = settings as WidgetSettings<'line'> & WidgetSettings<'area'> & WidgetSettings<'bar'>
  const ctx = useChartContext(dataset, columns, formatOverride(s))
  const { theme } = ctx
  const data = toSeries(rows, columns)
  const labels = data.categories.map((c) => ctx.dim(data.category, c))
  const horizontal = (type === 'bar' || type === 'stackedBar') && s.horizontal
  const stacked = type === 'stackedBar' || (type === 'area' && s.stacked)
  const firstMeasure = ctx.measures[0]
  const valueFmt = (v: number) => ctx.axisValue(firstMeasure, v)
  const showLegend = s.showLegend && data.series.length > 1

  const series = data.series.map((ser) => {
    const m = ctx.measureOf(data, ser)
    const common = {
      name: ctx.seriesName(data, ser),
      data: ser.values,
      emphasis: { focus: 'series' as const },
      stack: stacked ? 'total' : undefined,
      label: {
        show: s.showLabels,
        position: stacked
          ? ('inside' as const)
          : horizontal
            ? theme.rtl
              ? ('left' as const)
              : ('right' as const)
            : ('top' as const),
        color: theme.text,
        fontSize: 11,
        formatter: (p: { value: unknown }) => ctx.axisValue(m, Number(p.value)),
      },
      tooltip: { valueFormatter: (v: unknown) => ctx.value(m, v) },
    }
    if (type === 'line' || type === 'area') {
      return {
        ...common,
        type: 'line' as const,
        smooth: s.smooth,
        showSymbol: type === 'line' ? s.showPoints : false,
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        connectNulls: true,
        areaStyle:
          type === 'area'
            ? { opacity: stacked ? 0.55 : 0.22 }
            : s.fillArea
              ? { opacity: 0.14 }
              : undefined,
      }
    }
    return {
      ...common,
      type: 'bar' as const,
      barMaxWidth: 48,
      itemStyle: {
        borderRadius: stacked ? 2 : 4,
        borderColor: theme.surface,
        borderWidth: stacked ? 1 : 0,
      },
    }
  })

  const cat = categoryAxis(theme, labels, horizontal ? true : theme.rtl)
  const val = valueAxis(
    theme,
    valueFmt,
    horizontal ? { inverse: theme.rtl } : { position: theme.rtl ? 'right' : 'left' },
  )
  const option = {
    ...baseOption(theme, s.colorOffset),
    legend: legend(theme, showLegend),
    tooltip: {
      ...tooltip(theme, 'axis'),
      axisPointer: { type: type === 'line' || type === 'area' ? 'line' : 'shadow' },
    },
    grid: { left: 4, right: 12, top: showLegend ? 30 : 10, bottom: 2, containLabel: true },
    xAxis: horizontal
      ? { ...val, position: undefined }
      : { ...cat, boundaryGap: type === 'bar' || type === 'stackedBar' },
    yAxis: horizontal ? { ...cat, position: theme.rtl ? 'right' : 'left' } : val,
    series,
  }
  return <EChart option={option} label={widget.title} />
}
