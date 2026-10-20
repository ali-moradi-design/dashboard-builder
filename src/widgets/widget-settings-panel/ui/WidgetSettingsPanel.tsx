import { Copy, Sigma, Trash2, X } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

import { useEditor } from '@/entities/dashboard'
import { useDataset } from '@/entities/dataset'
import { describeQuery } from '@/entities/query'
import {
  parseSettings,
  settingsForm,
  widgetDefinitions,
  WidgetTypeIcon,
  type Widget,
} from '@/entities/widget'
import { useFormat } from '@/shared/lib'
import { localize } from '@/shared/lib/localized'
import { SettingsForm } from '@/shared/lib/settings-form'
import { Button } from '@/shared/ui'

export interface WidgetSettingsPanelProps {
  widget: Widget
  onEditQuery: () => void
}

/** Settings of the selected widget: title, query summary and the type's settings form. */
export function WidgetSettingsPanel({ widget, onEditQuery }: WidgetSettingsPanelProps) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const titleId = useId()
  const updateWidget = useEditor((s) => s.updateWidget)
  const removeWidget = useEditor((s) => s.removeWidget)
  const duplicateWidget = useEditor((s) => s.duplicateWidget)
  const select = useEditor((s) => s.select)
  const historyRev = useEditor((s) => s.historyRev)
  const dataset = useDataset(widget.query?.datasetId)
  const hasQuery = widgetDefinitions[widget.type].query !== null
  const label = (name: string) => {
    const f = dataset?.fields.find((x) => x.name === name)
    return f ? localize(f.label, fmt.lang) : name
  }

  return (
    <section aria-labelledby="settings-title" className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <WidgetTypeIcon type={widget.type} className="size-4 text-muted" />
        <h2
          id="settings-title"
          className="flex-1 text-xs font-semibold tracking-wide text-muted uppercase rtl:tracking-normal rtl:normal-case"
        >
          {t('editor.settings')} · {t(`widgetTypes.${widget.type}`)}
        </h2>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => select(null)}
          aria-label={t('common.close')}
        >
          <X aria-hidden />
        </Button>
      </div>

      <div>
        <label htmlFor={titleId} className="mb-1 block text-xs font-medium text-muted">
          {t('editor.title')}
        </label>
        <input
          id={titleId}
          key={`${widget.id}-${historyRev}`}
          defaultValue={widget.title}
          dir="auto"
          maxLength={200}
          onChange={(e) => updateWidget(widget.id, { title: e.target.value }, 'title')}
          className="h-9 w-full rounded-lg border border-border bg-bg px-2.5 text-sm"
        />
      </div>

      {hasQuery && (
        <div className="rounded-lg border border-border bg-bg p-3">
          <h3 className="mb-1 text-xs font-medium text-muted">{t('editor.query')}</h3>
          <p className="text-sm" data-testid="settings-query">
            {widget.query
              ? describeQuery(widget.query, label, t).map((p, i) =>
                  p.strong ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>,
                )
              : t('widget.notSetUp')}
          </p>
          {dataset && (
            <p className="mt-1 text-xs text-muted">{localize(dataset.label, fmt.lang)}</p>
          )}
          <Button className="mt-3 w-full" onClick={onEditQuery}>
            <Sigma aria-hidden />
            {t('editor.editQuery')}
          </Button>
        </div>
      )}

      <SettingsForm
        key={`${widget.id}-${widget.type}-${historyRev}`}
        document={settingsForm(widget.type)}
        values={parseSettings(widget.type, widget.settings)}
        locale={fmt.lang}
        onChange={(values, name) =>
          updateWidget(widget.id, { settings: values }, name ? `settings.${name}` : 'settings')
        }
      />

      <div className="mt-2 flex gap-2 border-t border-border pt-4">
        <Button className="flex-1" onClick={() => duplicateWidget(widget.id)}>
          <Copy aria-hidden />
          {t('editor.duplicate')}
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => removeWidget(widget.id)}>
          <Trash2 aria-hidden />
          {t('common.delete')}
        </Button>
      </div>
    </section>
  )
}
