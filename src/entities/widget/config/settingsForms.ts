import type { FormDocument, FormField } from '@/shared/lib/settings-form'

import type { WidgetType } from '../model/types'

const sw = (key: string, en: string, fa: string): FormField => ({
  type: 'switch',
  key,
  label: { en, fa },
})

const format: FormField = {
  type: 'select',
  key: 'format',
  width: 'half',
  label: { en: 'Number format', fa: 'قالب عدد' },
  settings: {
    options: [
      { value: 'auto', label: { en: 'From the field', fa: 'از فیلد' } },
      { value: 'number', label: { en: 'Number', fa: 'عدد' } },
      { value: 'compact', label: { en: 'Compact (12.3K)', fa: 'فشرده (12.3K)' } },
      { value: 'currency', label: { en: 'Currency (€)', fa: 'ارز (€)' } },
      { value: 'percent', label: { en: 'Percent', fa: 'درصد' } },
    ],
  },
}
const decimals: FormField = {
  type: 'number',
  key: 'decimals',
  width: 'half',
  label: { en: 'Decimals', fa: 'رقم اعشار' },
  settings: { min: 0, max: 6, integer: true },
}
const colorOffset: FormField = {
  type: 'select',
  key: 'colorOffset',
  width: 'half',
  label: { en: 'First color', fa: 'رنگ اول' },
  settings: {
    options: ['Teal', 'Silver', 'Slate', 'Mist', 'Lagoon'].map((name, i) => ({
      value: String(i),
      label: { en: name, fa: ['فیروزه‌ای', 'نقره‌ای', 'سربی', 'مه', 'آبی دریایی'][i] ?? name },
    })),
  },
}
const chart: FormField[] = [
  format,
  decimals,
  colorOffset,
  sw('showLegend', 'Show legend', 'نمایش راهنما'),
  sw('showLabels', 'Data labels', 'برچسب داده'),
]

const fields: Record<WidgetType, FormField[]> = {
  kpi: [
    format,
    decimals,
    sw('showDelta', 'Change vs. previous period', 'تغییر نسبت به دورهٔ قبل'),
    sw('showSparkline', 'Sparkline', 'نمودار کوچک'),
  ],
  line: [
    ...chart,
    sw('smooth', 'Smooth line', 'خط نرم'),
    sw('showPoints', 'Show points', 'نمایش نقطه‌ها'),
    sw('fillArea', 'Fill area', 'پر کردن زیر خط'),
  ],
  area: [...chart, sw('smooth', 'Smooth line', 'خط نرم'), sw('stacked', 'Stacked', 'انباشته')],
  bar: [...chart, sw('horizontal', 'Horizontal bars', 'میله‌های افقی')],
  stackedBar: [...chart, sw('horizontal', 'Horizontal bars', 'میله‌های افقی')],
  pie: [...chart, sw('donut', 'Donut', 'حلقه‌ای')],
  scatter: [
    ...chart,
    {
      type: 'number',
      key: 'pointSize',
      width: 'half',
      label: { en: 'Point size', fa: 'اندازهٔ نقطه' },
      settings: { min: 2, max: 20, integer: true },
    },
  ],
  heatmap: [format, decimals, sw('showLabels', 'Show values', 'نمایش مقدارها')],
  table: [
    format,
    decimals,
    {
      type: 'number',
      key: 'pageSize',
      width: 'half',
      label: { en: 'Rows per page', fa: 'ردیف در هر صفحه' },
      settings: { min: 3, max: 100, integer: true },
    },
  ],
  heading: [
    {
      type: 'shortText',
      key: 'subtitle',
      label: { en: 'Subtitle', fa: 'زیرعنوان' },
      settings: { maxLength: 300 },
    },
    {
      type: 'radio',
      key: 'align',
      label: { en: 'Alignment', fa: 'چینش' },
      settings: {
        options: [
          { value: 'start', label: { en: 'Start', fa: 'آغاز' } },
          { value: 'center', label: { en: 'Center', fa: 'وسط' } },
        ],
      },
    },
  ],
  text: [
    {
      type: 'longText',
      key: 'content',
      label: { en: 'Text', fa: 'متن' },
      help: {
        en: 'Supports **bold**, *italic*, lists (- item), # headings and [links](https://…).',
        fa: 'از **پررنگ**، *کج*، فهرست (- مورد)، # تیتر و [پیوند](https://…) پشتیبانی می‌کند.',
      },
      settings: { maxLength: 5000 },
    },
  ],
}

/** Settings form of each widget type, as a formcanvas form document (JSON). */
export function settingsForm(type: WidgetType): FormDocument {
  return {
    schemaVersion: 1,
    id: `widget-settings-${type}`,
    title: { en: 'Widget settings', fa: 'تنظیمات ویجت' },
    locales: { default: 'en', supported: ['en', 'fa'] },
    steps: [{ key: 'display', fields: fields[type] }],
  }
}
