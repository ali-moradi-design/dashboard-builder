import type { Dataset, DatasetField } from '@/entities/dataset/@x/widget'
import type { Measure, QuerySpec } from '@/shared/lib/query-engine'

import type { WidgetType } from '../model/types'

function pickMeasureField(dataset: Dataset): DatasetField | undefined {
  const numbers = dataset.fields.filter(
    (f) => f.type === 'number' && !f.display && !/(^|_)id$/i.test(f.name),
  )
  return numbers.find((f) => f.format?.style === 'currency') ?? numbers[0]
}

/** A sensible first query for a new widget, so it shows data right away. */
export function defaultQuery(type: WidgetType, dataset: Dataset): QuerySpec | undefined {
  const base: QuerySpec = {
    datasetId: dataset.id,
    measures: [],
    dimensions: [],
    filters: [],
    sort: [],
    limit: 1000,
  }
  const num = pickMeasureField(dataset)
  const numbers = dataset.fields.filter((f) => f.type === 'number' && !f.display)
  const text = dataset.fields.filter((f) => f.type === 'string')
  const date =
    dataset.fields.find((f) => f.name === dataset.dateField) ??
    dataset.fields.find((f) => f.type === 'date')
  const measure: Measure = num
    ? { id: 'm1', agg: 'sum', field: num.name }
    : { id: 'm1', agg: 'count' }
  const byText = text[0] ? [{ id: 'd1', field: text[0].name }] : []
  const byMonth = date ? [{ id: 'd1', field: date.name, grain: 'month' as const }] : byText

  switch (type) {
    case 'heading':
    case 'text':
      return undefined
    case 'kpi':
      return {
        ...base,
        measures: [measure],
        dimensions: date ? [{ id: 'd1', field: date.name, grain: 'year' }] : [],
      }
    case 'line':
    case 'area':
      return { ...base, measures: [measure], dimensions: byMonth }
    case 'bar':
    case 'pie':
    case 'table':
      return {
        ...base,
        measures: [measure],
        dimensions: byText.length ? byText : byMonth,
        sort: [{ by: 'm1', dir: 'desc' }],
        limit: type === 'pie' ? 12 : 1000,
      }
    case 'stackedBar':
      return {
        ...base,
        measures: [measure],
        dimensions: [
          ...(date ? [{ id: 'd1', field: date.name, grain: 'year' as const }] : byText),
          ...(text[date ? 0 : 1]
            ? [{ id: 'd2', field: (text[date ? 0 : 1] as DatasetField).name }]
            : []),
        ],
      }
    case 'scatter': {
      const [a, b] = numbers
      if (!a || !b || !text[0]) return { ...base, measures: [measure], dimensions: byText }
      return {
        ...base,
        measures: [
          { id: 'm1', agg: 'avg', field: a.name },
          { id: 'm2', agg: 'avg', field: b.name },
        ],
        dimensions: [{ id: 'd1', field: text[0].name }],
      }
    }
    case 'heatmap': {
      const dims = [...dataset.fields.filter((f) => f.display), ...text].slice(0, 2)
      return {
        ...base,
        measures: [{ id: 'm1', agg: 'count' }],
        dimensions: dims.map((f, i) => ({ id: `d${i + 1}`, field: f.name })),
      }
    }
  }
}
