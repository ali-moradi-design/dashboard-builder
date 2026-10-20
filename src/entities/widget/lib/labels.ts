import type { TFunction } from 'i18next'

import { findField, type Dataset } from '@/entities/dataset/@x/widget'
import type { Lang } from '@/shared/model'
import { localize } from '@/shared/lib/localized'
import type { ResultColumn } from '@/shared/lib/query-engine'

/** "Sum of Revenue", "Number of rows", or the field label for a dimension. */
export function columnLabel(
  col: ResultColumn,
  dataset: Dataset | undefined,
  lang: Lang,
  t: TFunction,
): string {
  const field = dataset ? findField(dataset, col.field) : undefined
  const name = field ? localize(field.label, lang) : (col.field ?? '')
  if (col.kind === 'dimension') return name
  if (col.agg === 'count' && col.field === undefined) return t('agg.countRows')
  return t(`agg.${col.agg ?? 'sum'}`, { field: name })
}
