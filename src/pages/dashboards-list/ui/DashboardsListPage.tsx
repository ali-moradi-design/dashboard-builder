import { Link, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { newId, useDashboards, useDeleteDashboard, useSaveDashboard } from '@/entities/dashboard'
import { formatDate, formatNumber, useFormat } from '@/shared/lib'
import { Button, Card } from '@/shared/ui'
import { AppHeader } from '@/widgets/app-header'

export function DashboardsListPage() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const navigate = useNavigate()
  const { data: dashboards, isLoading } = useDashboards()
  const save = useSaveDashboard()
  const remove = useDeleteDashboard()

  async function create() {
    const now = new Date().toISOString()
    const d = await save.mutateAsync({
      schemaVersion: 1,
      id: newId('dash'),
      title: t('list.untitled'),
      widgets: [],
      createdAt: now,
      updatedAt: now,
    })
    await navigate({ to: '/d/$dashboardId/edit', params: { dashboardId: d.id } })
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t('list.title')}</h1>
            <p className="mt-1 text-muted">{t('list.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void create()} disabled={save.isPending}>
              <Plus aria-hidden />
              {t('list.new')}
            </Button>
          </div>
        </div>
        {isLoading ? (
          <p className="mt-8 text-muted">{t('common.loading')}</p>
        ) : !dashboards?.length ? (
          <p className="mt-8 text-muted">{t('list.empty')}</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((d) => (
              <li key={d.id}>
                <Card className="relative flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                      <LayoutDashboard className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        <Link
                          to="/d/$dashboardId"
                          params={{ dashboardId: d.id }}
                          className="after:absolute after:inset-0 hover:underline"
                        >
                          {d.title}
                        </Link>
                      </h2>
                      <p className="text-xs text-muted">
                        {t('list.widgets', {
                          n: formatNumber(d.widgets.length, fmt, { decimals: 0 }),
                        })}{' '}
                        · {formatDate(new Date(d.updatedAt), fmt)}
                      </p>
                    </div>
                  </div>
                  {d.description && (
                    <p className="line-clamp-2 text-sm text-muted">{d.description}</p>
                  )}
                  <div className="relative z-10 mt-auto flex gap-2">
                    <Button size="sm" asChild>
                      <Link to="/d/$dashboardId/edit" params={{ dashboardId: d.id }}>
                        {t('view.edit')}
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={t('list.deleteNamed', { name: d.title })}
                      onClick={() => {
                        if (window.confirm(t('list.confirmDelete', { name: d.title })))
                          remove.mutate(d.id)
                      }}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
