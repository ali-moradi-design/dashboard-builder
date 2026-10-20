import { z } from 'zod'

import { querySpecSchema } from '@/shared/lib/query-engine'

export const widgetTypes = [
  'kpi',
  'line',
  'area',
  'bar',
  'stackedBar',
  'pie',
  'scatter',
  'heatmap',
  'table',
  'heading',
  'text',
] as const
export type WidgetType = (typeof widgetTypes)[number]

export const GRID_COLS = 12

export const widgetLayoutSchema = z.object({
  x: z
    .number()
    .int()
    .min(0)
    .max(GRID_COLS - 1),
  y: z.number().int().min(0).max(10_000),
  w: z.number().int().min(1).max(GRID_COLS),
  h: z.number().int().min(1).max(40),
})
export type WidgetLayout = z.infer<typeof widgetLayoutSchema>

export const widgetSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(widgetTypes),
  title: z.string().max(200),
  query: querySpecSchema.optional(),
  /** Validated per type with the settings schemas; unknown keys are dropped there. */
  settings: z.record(z.string(), z.unknown()),
  layout: widgetLayoutSchema,
})
export type Widget = z.infer<typeof widgetSchema>
