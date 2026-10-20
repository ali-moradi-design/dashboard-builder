import { useTranslation } from 'react-i18next'

import { useEditor } from '@/entities/dashboard'
import { getDataset, sampleDatasets } from '@/entities/dataset'
import { defaultQuery, type WidgetLayout, type WidgetType } from '@/entities/widget'

/** Adds a widget with a ready query on the dashboard's main dataset. */
export function useAddWidget() {
  const { t } = useTranslation()
  const addWidget = useEditor((s) => s.addWidget)
  return (type: WidgetType, at?: WidgetLayout) => {
    const widgets = useEditor.getState().dashboard?.widgets ?? []
    const datasetId = widgets.find((w) => w.query)?.query?.datasetId
    const dataset = (datasetId ? getDataset(datasetId) : undefined) ?? sampleDatasets[0]
    const settings: Record<string, unknown> =
      type === 'text'
        ? { content: t('editor.newText') }
        : type === 'heading'
          ? { subtitle: '' }
          : {}
    return addWidget(
      {
        type,
        title: type === 'heading' ? t('editor.newHeading') : t(`widgetTypes.${type}`),
        query: dataset ? defaultQuery(type, dataset) : undefined,
        settings,
      },
      at,
    )
  }
}
