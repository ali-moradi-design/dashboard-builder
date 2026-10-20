import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useDashboard } from '@/entities/dashboard'
import { useDataset } from '@/entities/dataset'
import { DateRangeFilter } from '@/features/apply-date-filter'
import { ExportButton } from '@/features/export-import-dashboard'
import type { DateRange } from '@/shared/lib/query-engine'
import { Button } from '@/shared/ui'
import { AppHeader } from '@/widgets/app-header'
import { DashboardGrid } from '@/widgets/dashboard-grid'
import { WidgetFrame } from '@/widgets/widget-frame'

export function DashboardViewPage() {
  const { t } = useTranslation()
  const { dashboardId } = useParams({ from: '/d/$dashboardId' })
  const search = useSearch({ from: '/d/$dashboardId' })
  const navigate = useNavigate({ from: '/d/$dashboardId' })
  const { data: dashboard, isLoading } = useDashboard(dashboardId)
  const mainDatasetId = dashboard?.widgets.find((w) => w.query)?.query?.datasetId
  const dataset = useDataset(mainDatasetId)
  const urlHasRange = search.from !== undefined || search.to !== undefined
  const dateRange: DateRange = urlHasRange
    ? { from: search.from, to: search.to }
    : (dashboard?.dateRange ?? {})

  if (isLoading) return <AppHeader />
  if (!dashboard) {
    return (
      <>
        <AppHeader />
        <p className="p-8 text-muted">{t('common.notFound')}</p>
      </>
    )
  }

  return (
    <>
      <AppHeader
        crumbs={dashboard.title}
        actions={
          <>
            <ExportButton dashboard={dashboard} />
            <Button variant="primary" asChild>
              <Link to="/d/$dashboardId/edit" params={{ dashboardId }} search={search}>
                <Pencil aria-hidden />
                {t('view.edit')}
              </Link>
            </Button>
          </>
        }
      />
      <main className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold [unicode-bidi:plaintext]">{dashboard.title}</h1>
          {dashboard.description && (
            <p className="text-muted [unicode-bidi:plaintext]">{dashboard.description}</p>
          )}
        </div>
        <div className="mb-4">
          <DateRangeFilter
            value={dateRange}
            dataset={dataset}
            onChange={(r) => void navigate({ search: { from: r.from, to: r.to }, replace: true })}
          />
        </div>
        <h2 className="sr-only">{t('view.widgets')}</h2>
        <DashboardGrid
          widgets={dashboard.widgets}
          renderWidget={(w) => <WidgetFrame widget={w} dateRange={dateRange} />}
        />
      </main>
    </>
  )
}
