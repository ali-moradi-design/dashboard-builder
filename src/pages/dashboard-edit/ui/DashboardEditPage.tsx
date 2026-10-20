import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Check, Copy, MousePointerClick, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useDashboard, useEditor, useSaveDashboard } from '@/entities/dashboard'
import { useDataset } from '@/entities/dataset'
import { WidgetPalette, useAddWidget } from '@/features/add-widget'
import { DateRangeFilter } from '@/features/apply-date-filter'
import { UndoRedoButtons } from '@/features/undo-redo'
import { cn } from '@/shared/lib'
import type { DateRange } from '@/shared/lib/query-engine'
import { useSettings } from '@/shared/model'
import { Button } from '@/shared/ui'
import { AppHeader } from '@/widgets/app-header'
import { EditableGrid, WIDGET_MIME, widgetTypeMime } from '@/widgets/dashboard-grid'
import { QueryBuilderPanel } from '@/widgets/query-builder-panel'
import { WidgetFrame } from '@/widgets/widget-frame'
import { WidgetSettingsPanel } from '@/widgets/widget-settings-panel'

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/** Saves the draft shortly after each change. */
function useAutosave() {
  const save = useSaveDashboard()
  const dashboard = useEditor((s) => s.dashboard)
  const dirty = useEditor((s) => s.dirty)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!dashboard || !dirty) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      save.mutate(dashboard, { onSuccess: () => useEditor.getState().markSaved() })
    }, 500)
    return () => window.clearTimeout(timer.current)
  }, [dashboard, dirty, save])
  return { saving: dirty || save.isPending, error: save.error }
}

export function DashboardEditPage() {
  const { t } = useTranslation()
  const { dashboardId } = useParams({ from: '/d/$dashboardId/edit' })
  const search = useSearch({ from: '/d/$dashboardId/edit' })
  const navigate = useNavigate({ from: '/d/$dashboardId/edit' })
  const stored = useDashboard(dashboardId)
  const dashboard = useEditor((s) => s.dashboard)
  const selectedId = useEditor((s) => s.selectedId)
  const historyRev = useEditor((s) => s.historyRev)
  const { select, setTitle, updateLayouts, updateWidget, removeWidget, duplicateWidget } =
    useEditor.getState()
  const add = useAddWidget()
  const rtl = useSettings((s) => s.lang) === 'fa'
  const { saving } = useAutosave()

  // Load the stored dashboard into the editor once per dashboard.
  useEffect(() => {
    if (stored.data && useEditor.getState().dashboard?.id !== stored.data.id)
      useEditor.getState().load(stored.data)
  }, [stored.data])

  // Delete / Backspace removes the selected widget, Escape clears the selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const id = useEditor.getState().selectedId
      if (e.key === 'Escape') useEditor.getState().select(null)
      if (
        id &&
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !document.querySelector('[role="dialog"]')
      ) {
        e.preventDefault()
        useEditor.getState().removeWidget(id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const datasetId = dashboard?.widgets.find((w) => w.query)?.query?.datasetId
  const dataset = useDataset(datasetId)
  const urlHasRange = search.from !== undefined || search.to !== undefined
  const dateRange: DateRange = urlHasRange
    ? { from: search.from, to: search.to }
    : (dashboard?.dateRange ?? {})

  if (stored.isLoading || !dashboard || dashboard.id !== dashboardId) {
    return (
      <>
        <AppHeader />
        <p className="p-8 text-muted">
          {stored.isLoading || stored.data ? t('common.loading') : t('common.notFound')}
        </p>
      </>
    )
  }

  const selected = dashboard.widgets.find((w) => w.id === selectedId)
  const queryWidget = search.query
    ? dashboard.widgets.find((w) => w.id === search.query)
    : undefined
  const setQueryParam = (query: string | undefined) =>
    void navigate({ search: (s) => ({ ...s, query }), replace: true })

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        crumbs={dashboard.title}
        actions={
          <>
            <UndoRedoButtons />
            <span className="hidden text-xs text-muted sm:inline" aria-live="polite">
              {saving ? t('editor.saving') : t('editor.saved')}
            </span>
            <Button variant="primary" asChild>
              <Link
                to="/d/$dashboardId"
                params={{ dashboardId }}
                search={{ from: search.from, to: search.to }}
              >
                <Check aria-hidden />
                {t('editor.done')}
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid flex-1 lg:grid-cols-[220px_1fr_340px]">
        <aside
          aria-label={t('editor.widgets')}
          className="border-border bg-surface p-4 lg:border-e"
        >
          <WidgetPalette mimeFor={widgetTypeMime} baseMime={WIDGET_MIME} />
        </aside>
        <main className="min-w-0 p-4 sm:p-5">
          <h1 className="sr-only">{t('editor.editing', { title: dashboard.title })}</h1>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="dash-title">
              {t('editor.dashboardTitle')}
            </label>
            <input
              id="dash-title"
              defaultValue={dashboard.title}
              key={historyRev}
              dir="auto"
              maxLength={120}
              onChange={(e) => e.target.value.trim() && setTitle(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-xl font-bold hover:border-border focus:border-border"
            />
            <DateRangeFilter
              value={dateRange}
              dataset={dataset}
              onChange={(r) =>
                void navigate({ search: (s) => ({ ...s, from: r.from, to: r.to }), replace: true })
              }
            />
          </div>
          {dashboard.widgets.length === 0 && (
            <p className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-muted">
              <MousePointerClick className="size-5" aria-hidden />
              {t('editor.emptyHint')}
            </p>
          )}
          <EditableGrid
            widgets={dashboard.widgets}
            rtl={rtl}
            onCommit={updateLayouts}
            onDropType={(type, at) => add(type, at)}
            renderWidget={(w) => (
              <div
                className="h-full"
                role="button"
                tabIndex={0}
                aria-pressed={w.id === selectedId}
                aria-label={t('editor.selectWidget', {
                  title: w.title || t(`widgetTypes.${w.type}`),
                })}
                onMouseDown={() => select(w.id)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    select(w.id)
                  }
                }}
              >
                <WidgetFrame
                  widget={w}
                  dateRange={dateRange}
                  selected={w.id === selectedId}
                  className={cn(w.id !== selectedId && 'border-dashed', 'cursor-move')}
                  actions={
                    <span
                      className={cn(
                        'flex gap-0.5',
                        w.id === selectedId
                          ? 'opacity-100'
                          : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100',
                      )}
                    >
                      <Button
                        size="iconSm"
                        variant="ghost"
                        aria-label={t('editor.duplicate')}
                        onClick={() => duplicateWidget(w.id)}
                      >
                        <Copy aria-hidden />
                      </Button>
                      <Button
                        size="iconSm"
                        variant="ghost"
                        aria-label={t('common.delete')}
                        onClick={() => removeWidget(w.id)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </span>
                  }
                />
              </div>
            )}
          />
        </main>
        <aside
          aria-label={t('editor.settings')}
          className="border-border bg-surface p-4 lg:border-s"
        >
          {selected ? (
            <WidgetSettingsPanel widget={selected} onEditQuery={() => setQueryParam(selected.id)} />
          ) : (
            <p className="text-sm text-muted">{t('editor.selectHint')}</p>
          )}
        </aside>
      </div>
      {queryWidget && (
        <QueryBuilderPanel
          key={queryWidget.id}
          widget={queryWidget}
          dateRange={dateRange}
          onClose={() => setQueryParam(undefined)}
          onApply={(query, type) => {
            updateWidget(queryWidget.id, { query, type })
            setQueryParam(undefined)
          }}
        />
      )}
    </div>
  )
}
