import {
  AreaChart,
  BarChart3,
  ChartColumnStacked,
  ChartScatter,
  Grid3x3,
  Heading,
  LineChart,
  PieChart,
  Table,
  Text,
  TrendingUp,
  type LucideProps,
} from 'lucide-react'

import type { WidgetType } from '../model/types'

const icons = {
  kpi: TrendingUp,
  line: LineChart,
  area: AreaChart,
  bar: BarChart3,
  stackedBar: ChartColumnStacked,
  pie: PieChart,
  scatter: ChartScatter,
  heatmap: Grid3x3,
  table: Table,
  heading: Heading,
  text: Text,
} satisfies Record<WidgetType, unknown>

export function WidgetTypeIcon({ type, ...props }: { type: WidgetType } & LucideProps) {
  const Icon = icons[type]
  return <Icon aria-hidden {...props} />
}
