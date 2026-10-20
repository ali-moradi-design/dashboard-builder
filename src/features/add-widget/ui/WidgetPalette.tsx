import { GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { WidgetTypeIcon, widgetTypes, type WidgetType } from '@/entities/widget'

import { useAddWidget } from '../model/useAddWidget'

export interface WidgetPaletteProps {
  /** MIME type builder shared with the grid's drop target. */
  mimeFor: (type: WidgetType) => string
  baseMime: string
}

/** Widget types to drag onto the grid; click or Enter adds one at the bottom. */
export function WidgetPalette({ mimeFor, baseMime }: WidgetPaletteProps) {
  const { t } = useTranslation()
  const add = useAddWidget()
  return (
    <section aria-labelledby="palette-title">
      <h2
        id="palette-title"
        className="mb-2.5 text-xs font-semibold tracking-wide text-muted uppercase rtl:tracking-normal rtl:normal-case"
      >
        {t('editor.widgets')}
      </h2>
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {widgetTypes.map((type) => (
          <li key={type}>
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(baseMime, type)
                e.dataTransfer.setData(mimeFor(type), type)
                e.dataTransfer.setData('text/plain', '')
                e.dataTransfer.effectAllowed = 'copy'
              }}
              onClick={() => add(type)}
              className="flex w-full cursor-grab items-center gap-2.5 rounded-lg border border-border bg-bg px-2.5 py-2 text-start font-medium hover:border-accent active:cursor-grabbing"
              data-testid={`palette-${type}`}
            >
              <WidgetTypeIcon type={type} className="size-4 shrink-0" />
              <span className="truncate">{t(`widgetTypes.${type}`)}</span>
              <GripVertical className="ms-auto size-4 shrink-0 text-muted" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t('editor.paletteHint')}</p>
    </section>
  )
}
