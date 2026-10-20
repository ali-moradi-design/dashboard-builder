import type { Dataset } from '@/entities/dataset/@x/widget'
import type { ResultColumn } from '@/shared/lib/query-engine'

import type { Row } from '../lib/series'
import type { WidgetSettings } from '../model/settings'
import type { Widget, WidgetType } from '../model/types'

export interface RendererProps<T extends WidgetType = WidgetType> {
  widget: Widget
  settings: WidgetSettings<T>
  rows: Row[]
  columns: ResultColumn[]
  dataset: Dataset | undefined
}
