import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Database, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ensureDatasetLoaded,
  FieldTypeIcon,
  useDatasets,
  useDatasetsStore,
  type Dataset,
} from '@/entities/dataset'
import { ImportCsvButton } from '@/features/import-dataset'
import { cn, formatNumber, useFormat } from '@/shared/lib'
import { runQuery } from '@/shared/lib/duckdb'
import { localize } from '@/shared/lib/localized'
import { quoteIdent } from '@/shared/lib/query-engine'
import { Button, Card, DataTable } from '@/shared/ui'
import { AppHeader } from '@/widgets/app-header'

function Preview({ dataset }: { dataset: Dataset }) {
  const { t } = useTranslation()
  const fmt = useFormat()
  const preview = useQuery({
    queryKey: ['preview', dataset.table],
    queryFn: async ({ signal }) => {
      await ensureDatasetLoaded(dataset)
      return (await runQuery(`SELECT * FROM ${quoteIdent(dataset.table)} LIMIT 200`, [], signal))
        .rows
    },
  })
  if (preview.isLoading) return <p className="text-muted">{t('common.loading')}</p>
  if (preview.error)
    return (
      <p role="alert" className="text-danger">
        {t('common.error')}
      </p>
    )
  return (
    <DataTable
      label={t('datasets.preview')}
      rows={preview.data ?? []}
      pageSize={10}
      columns={dataset.fields.map((f) => ({
        key: f.name,
        header: localize(f.label, fmt.lang),
        align: f.type === 'number' ? 'end' : 'start',
        format: (v) =>
          v === null || v === undefined
            ? '–'
            : f.type === 'number'
              ? formatNumber(Number(v), fmt, f.format)
              : typeof v === 'string'
                ? v
                : JSON.stringify(v),
      }))}
    />
  )
}

export function DatasetsPage() {
  const { t } = useTranslation()
  const fmt = useFormat()
  const datasets = useDatasets()
  const load = useDatasetsStore((s) => s.load)
  const remove = useDatasetsStore((s) => s.remove)
  const { id } = useSearch({ from: '/datasets' })
  const navigate = useNavigate({ from: '/datasets' })
  useEffect(() => void load(), [load])
  const selected = datasets.find((d) => d.id === id) ?? datasets[0]
  const select = (d: Dataset) => void navigate({ search: { id: d.id }, replace: true })

  return (
    <>
      <AppHeader crumbs={t('common.datasets')} />
      <main className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-5 lg:grid-cols-[280px_1fr]">
        <section aria-labelledby="ds-list" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 id="ds-list" className="text-lg font-bold">
              {t('common.datasets')}
            </h1>
          </div>
          <ul className="flex flex-col gap-2">
            {datasets.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => select(d)}
                  aria-current={d.id === selected?.id ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-3 text-start',
                    d.id === selected?.id && 'border-accent ring-2 ring-accent-soft',
                  )}
                >
                  <Database className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {localize(d.label, fmt.lang)}
                    </span>
                    <span className="block text-xs text-muted">
                      {d.builtIn ? t('datasets.sample') : t('datasets.imported')}
                      {d.rowCount !== undefined &&
                        ` · ${t('datasets.rows', { n: formatNumber(d.rowCount, fmt, { decimals: 0 }) })}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <ImportCsvButton onImported={select} />
          <p className="text-xs text-muted">{t('datasets.privacy')}</p>
        </section>

        {selected && (
          <section aria-labelledby="ds-title" className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="ds-title" className="text-xl font-bold">
                  {localize(selected.label, fmt.lang)}
                </h2>
                {selected.description && (
                  <p className="mt-1 text-muted">{localize(selected.description, fmt.lang)}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="primary" asChild>
                  <Link to="/">{t('datasets.useInDashboard')}</Link>
                </Button>
                {!selected.builtIn && (
                  <Button
                    variant="danger"
                    onClick={() => void remove(selected.id).then(() => navigate({ search: {} }))}
                  >
                    <Trash2 aria-hidden />
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            </div>
            <Card className="p-4">
              <h3 className="mb-2 font-semibold">{t('datasets.fields')}</h3>
              <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
                {selected.fields.map((f) => (
                  <li key={f.name} className="flex items-center gap-2">
                    <FieldTypeIcon type={f.type} />
                    <span className="truncate">{localize(f.label, fmt.lang)}</span>
                    <code className="ms-auto truncate text-xs text-muted" dir="ltr">
                      {f.name}
                    </code>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="flex min-h-0 flex-col p-4">
              <h3 className="mb-2 font-semibold">{t('datasets.preview')}</h3>
              <Preview key={selected.id} dataset={selected} />
            </Card>
          </section>
        )}
      </main>
    </>
  )
}
