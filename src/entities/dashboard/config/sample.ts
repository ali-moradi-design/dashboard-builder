import type { Widget } from '@/entities/widget/@x/dashboard'

import type { Dashboard } from '../model/schema'

const year = { id: 'year', field: 'order_date', grain: 'year' } as const
const month = { id: 'month', field: 'order_date', grain: 'month' } as const

function q(partial: Partial<NonNullable<Widget['query']>>): NonNullable<Widget['query']> {
  return {
    datasetId: 'orders',
    measures: [],
    dimensions: [],
    filters: [],
    sort: [],
    limit: 1000,
    ...partial,
  }
}

/** The ready sample dashboard (matches the approved mockup). */
export const sampleDashboard: Dashboard = {
  schemaVersion: 1,
  id: 'sample-sales',
  title: 'Sales overview',
  description: 'Sample dashboard on the store orders dataset.',
  createdAt: '2026-10-20T00:00:00.000Z',
  updatedAt: '2026-10-20T00:00:00.000Z',
  widgets: [
    {
      id: 'kpi-revenue',
      type: 'kpi',
      title: 'Revenue',
      query: q({ measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }], dimensions: [year] }),
      settings: { format: 'currency' },
      layout: { x: 0, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi-orders',
      type: 'kpi',
      title: 'Orders',
      query: q({ measures: [{ id: 'n', agg: 'count' }], dimensions: [year] }),
      settings: {},
      layout: { x: 3, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi-aov',
      type: 'kpi',
      title: 'Avg. order value',
      query: q({ measures: [{ id: 'aov', agg: 'avg', field: 'revenue' }], dimensions: [year] }),
      settings: {},
      layout: { x: 6, y: 0, w: 3, h: 2 },
    },
    {
      id: 'kpi-profit',
      type: 'kpi',
      title: 'Profit',
      query: q({ measures: [{ id: 'profit', agg: 'sum', field: 'profit' }], dimensions: [year] }),
      settings: { format: 'currency' },
      layout: { x: 9, y: 0, w: 3, h: 2 },
    },
    {
      id: 'h-trends',
      type: 'heading',
      title: 'Trends',
      settings: { subtitle: 'Revenue and category mix over time' },
      layout: { x: 0, y: 2, w: 12, h: 1 },
    },
    {
      id: 'line-revenue',
      type: 'line',
      title: 'Revenue by month',
      query: q({ measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }], dimensions: [month] }),
      settings: { fillArea: true },
      layout: { x: 0, y: 3, w: 8, h: 5 },
    },
    {
      id: 'pie-category',
      type: 'pie',
      title: 'Share by category',
      query: q({
        measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }],
        dimensions: [{ id: 'cat', field: 'category' }],
      }),
      settings: { donut: true },
      layout: { x: 8, y: 3, w: 4, h: 5 },
    },
    {
      id: 'stacked-category-year',
      type: 'stackedBar',
      title: 'Revenue by category per year',
      query: q({
        measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }],
        dimensions: [year, { id: 'cat', field: 'category' }],
      }),
      settings: {},
      layout: { x: 0, y: 8, w: 7, h: 5 },
    },
    {
      id: 'bar-country',
      type: 'bar',
      title: 'Revenue by country',
      query: q({
        measures: [{ id: 'rev', agg: 'sum', field: 'revenue' }],
        dimensions: [{ id: 'country', field: 'country' }],
        sort: [{ by: 'rev', dir: 'desc' }],
      }),
      settings: { horizontal: true, showLabels: true },
      layout: { x: 7, y: 8, w: 5, h: 5 },
    },
    {
      id: 'h-orders',
      type: 'heading',
      title: 'Orders and products',
      settings: { subtitle: 'When customers buy and what sells best' },
      layout: { x: 0, y: 13, w: 12, h: 1 },
    },
    {
      id: 'heat-weekday-hour',
      type: 'heatmap',
      title: 'Orders by weekday and hour',
      query: q({
        measures: [{ id: 'n', agg: 'count' }],
        dimensions: [
          { id: 'hour', field: 'order_hour' },
          { id: 'weekday', field: 'order_weekday' },
        ],
      }),
      settings: {},
      layout: { x: 0, y: 14, w: 7, h: 5 },
    },
    {
      id: 'scatter-price-units',
      type: 'scatter',
      title: 'Price vs. units sold per product',
      query: q({
        measures: [
          { id: 'price', agg: 'avg', field: 'unit_price' },
          { id: 'units', agg: 'sum', field: 'quantity' },
        ],
        dimensions: [
          { id: 'product', field: 'product' },
          { id: 'cat', field: 'category' },
        ],
      }),
      settings: { pointSize: 12 },
      layout: { x: 7, y: 14, w: 5, h: 5 },
    },
    {
      id: 'area-segment',
      type: 'area',
      title: 'Profit by segment',
      query: q({
        measures: [{ id: 'profit', agg: 'sum', field: 'profit' }],
        dimensions: [month, { id: 'segment', field: 'segment' }],
      }),
      settings: { stacked: true },
      layout: { x: 0, y: 19, w: 4, h: 5 },
    },
    {
      id: 'table-products',
      type: 'table',
      title: 'Top products',
      query: q({
        measures: [
          { id: 'qty', agg: 'sum', field: 'quantity' },
          { id: 'rev', agg: 'sum', field: 'revenue' },
        ],
        dimensions: [
          { id: 'product', field: 'product' },
          { id: 'cat', field: 'category' },
        ],
        sort: [{ by: 'rev', dir: 'desc' }],
        limit: 50,
      }),
      settings: { pageSize: 5 },
      layout: { x: 4, y: 19, w: 5, h: 5 },
    },
    {
      id: 'text-notes',
      type: 'text',
      title: 'Notes',
      settings: {
        content:
          'Revenue grows every year, led by **Technology**.\n\n- Discounts above 25% rarely make a profit.\n- Most orders arrive on weekdays between 10:00 and 16:00.\n\nThe data is synthetic sample data.',
      },
      layout: { x: 9, y: 19, w: 3, h: 5 },
    },
  ],
}
