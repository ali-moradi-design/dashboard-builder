import type { ComponentType } from 'react'

import type { WidgetType } from '../model/types'
import { CartesianChart } from './CartesianChart'
import { HeadingWidget } from './HeadingWidget'
import { HeatmapChart } from './HeatmapChart'
import { KpiCard } from './KpiCard'
import { PieChart } from './PieChart'
import { ScatterChart } from './ScatterChart'
import { TableWidget } from './TableWidget'
import { TextWidget } from './TextWidget'
import type { RendererProps } from './types'

/** Renderer per widget type (the UI half of the widget registry). */
export const widgetRenderers = {
  kpi: KpiCard,
  line: CartesianChart,
  area: CartesianChart,
  bar: CartesianChart,
  stackedBar: CartesianChart,
  pie: PieChart,
  scatter: ScatterChart,
  heatmap: HeatmapChart,
  table: TableWidget,
  heading: HeadingWidget,
  text: TextWidget,
} as unknown as Record<WidgetType, ComponentType<RendererProps>>
