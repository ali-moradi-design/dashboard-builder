import type { QuerySpec } from '@/shared/lib/query-engine'

import type { WidgetLayout, WidgetType } from './types'

export interface QueryRequirements {
  measures: readonly [min: number, max: number]
  dimensions: readonly [min: number, max: number]
}

export interface WidgetDefinition {
  type: WidgetType
  /** `null` for widgets without data (heading, text). */
  query: QueryRequirements | null
  defaultSize: Pick<WidgetLayout, 'w' | 'h'>
  minSize: Pick<WidgetLayout, 'w' | 'h'>
}

/** Registry of widget types. New types are added here (and in the renderer map), not in the core. */
export const widgetDefinitions: Record<WidgetType, WidgetDefinition> = {
  kpi: {
    type: 'kpi',
    query: { measures: [1, 1], dimensions: [0, 1] },
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  line: {
    type: 'line',
    query: { measures: [1, 4], dimensions: [1, 2] },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  area: {
    type: 'area',
    query: { measures: [1, 4], dimensions: [1, 2] },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  bar: {
    type: 'bar',
    query: { measures: [1, 4], dimensions: [1, 2] },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  stackedBar: {
    type: 'stackedBar',
    query: { measures: [1, 4], dimensions: [1, 2] },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  pie: {
    type: 'pie',
    query: { measures: [1, 1], dimensions: [1, 1] },
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  scatter: {
    type: 'scatter',
    query: { measures: [2, 2], dimensions: [1, 2] },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  heatmap: {
    type: 'heatmap',
    query: { measures: [1, 1], dimensions: [2, 2] },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 3 },
  },
  table: {
    type: 'table',
    query: { measures: [0, 6], dimensions: [0, 2] },
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 3, h: 3 },
  },
  heading: { type: 'heading', query: null, defaultSize: { w: 12, h: 1 }, minSize: { w: 2, h: 1 } },
  text: { type: 'text', query: null, defaultSize: { w: 4, h: 4 }, minSize: { w: 2, h: 2 } },
}

export type QueryIssue =
  'missingQuery' | 'tooFewMeasures' | 'tooManyMeasures' | 'tooFewDimensions' | 'tooManyDimensions'

/** Checks a widget's query against its type's requirements. */
export function checkQuery(type: WidgetType, query: QuerySpec | undefined): QueryIssue | null {
  const req = widgetDefinitions[type].query
  if (!req) return null
  if (!query) return 'missingQuery'
  const m = query.measures.length
  const d = query.dimensions.length
  if (m < req.measures[0]) return 'tooFewMeasures'
  if (m > req.measures[1]) return 'tooManyMeasures'
  if (d < req.dimensions[0]) return 'tooFewDimensions'
  if (d > req.dimensions[1]) return 'tooManyDimensions'
  if (m + d === 0) return 'tooFewMeasures'
  return null
}
