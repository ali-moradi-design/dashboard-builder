import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { dashboardQuery, dashboardsQuery } from '@/entities/dashboard'
import { DashboardsListPage } from '@/pages/dashboards-list'
import { Skeleton } from '@/shared/ui'
import { AppHeader } from '@/widgets/app-header'

import { queryClient } from './queryClient'

// Heavy pages (charts, DuckDB, editor) load on demand.
const DashboardViewPage = lazyRouteComponent(
  () => import('@/pages/dashboard-view'),
  'DashboardViewPage',
)
const DashboardEditPage = lazyRouteComponent(
  () => import('@/pages/dashboard-edit'),
  'DashboardEditPage',
)
const DatasetsPage = lazyRouteComponent(() => import('@/pages/datasets'), 'DatasetsPage')

/**
 * Route loaders start the slow work while the page's code is still loading.
 * The dashboard document (a small IndexedDB read) is also fetched on link
 * hover (`defaultPreload`); the DuckDB engine, a large WebAssembly download on
 * the first visit, only when the page is really opened. Nothing is awaited,
 * so loaders never delay navigation; pages show their own loading states.
 */
function loadDashboard(dashboardId: string, preload: boolean) {
  void queryClient.query(dashboardQuery(dashboardId)).catch(noop)
  if (!preload) warmUpQueryEngine()
}

function warmUpQueryEngine() {
  void import('@/shared/lib/duckdb').then((m) => m.getDuckDB()).catch(noop)
}

/** Shown while a page's code is being downloaded. */
function PagePending() {
  const { t } = useTranslation()
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-5"
        role="status"
        aria-busy="true"
        aria-label={t('common.loading')}
      >
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </main>
    </>
  )
}

const noop = () => undefined

function NotFound() {
  const { t } = useTranslation()
  return <p className="p-8 text-muted">{t('common.notFound')}</p>
}

function RouteError({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  return (
    <div role="alert" className="p-8">
      <h1 className="text-lg font-semibold">{t('common.error')}</h1>
      <pre className="mt-2 text-xs whitespace-pre-wrap text-muted">
        {error instanceof Error ? error.message : String(error)}
      </pre>
    </div>
  )
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
})

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: () => void queryClient.query(dashboardsQuery()).catch(noop),
  component: DashboardsListPage,
})

/** Global date filter lives in the URL so a link reproduces the view. */
const dateSearch = z.object({
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
})

const viewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/d/$dashboardId',
  validateSearch: dateSearch,
  loader: ({ params, preload }) => loadDashboard(params.dashboardId, preload),
  component: DashboardViewPage,
})

const editRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/d/$dashboardId/edit',
  validateSearch: dateSearch.extend({ query: z.string().optional().catch(undefined) }),
  loader: ({ params, preload }) => loadDashboard(params.dashboardId, preload),
  component: DashboardEditPage,
})

const datasetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/datasets',
  validateSearch: z.object({ id: z.string().optional().catch(undefined) }),
  loader: ({ preload }) => {
    if (!preload) warmUpQueryEngine()
  },
  component: DatasetsPage,
})

const routeTree = rootRoute.addChildren([listRoute, viewRoute, editRoute, datasetsRoute])

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPreload: 'intent',
  // A page chunk that is slow to arrive shows a skeleton instead of a blank screen.
  defaultPendingComponent: PagePending,
  defaultPendingMs: 200,
  defaultPendingMinMs: 300,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
