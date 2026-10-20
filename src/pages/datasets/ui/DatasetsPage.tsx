import { useTranslation } from 'react-i18next'

import { AppHeader } from '@/widgets/app-header'

export function DatasetsPage() {
  const { t } = useTranslation()
  return (
    <>
      <AppHeader crumbs={t('common.datasets')} />
      <main className="p-5" />
    </>
  )
}
