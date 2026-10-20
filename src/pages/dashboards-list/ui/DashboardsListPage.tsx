import { useTranslation } from 'react-i18next'

import { AppHeader } from '@/widgets/app-header'

export function DashboardsListPage() {
  const { t } = useTranslation()
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl p-5">
        <h1 className="text-2xl font-bold">{t('list.title')}</h1>
        <p className="mt-1 text-muted">{t('list.subtitle')}</p>
        <p className="mt-8 text-muted">{t('list.empty')}</p>
      </main>
    </>
  )
}
